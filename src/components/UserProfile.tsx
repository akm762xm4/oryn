import { useState } from "react";
import { Camera, Save, User } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useForm } from "react-hook-form";
import { Modal, Button, Input } from "./ui";
import toast from "react-hot-toast";
import api from "../lib/api";

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileForm {
  username: string;
  email: string;
}

export default function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const { user, login, updateUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    reset({
      username: user?.username || "",
      email: user?.email || "",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await api.put("/auth/profile", data);
      const updatedUser = response.data.user;

      // Update user in auth store
      login(localStorage.getItem("token") || "", updatedUser);

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Failed to update profile"
          : "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image size must be less than 4MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await api.post("/auth/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      updateUser({ avatar: response.data.avatarUrl });

      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }

    // Reset file input
    e.target.value = "";
  };

  if (!isOpen || !user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Settings" size="md">
      <div className="p-0">
        {/* Avatar section */}
        <div className="flex flex-col items-center md:mb-6 mb-3">
          <div className="relative">
            <div className="md:w-28 md:h-28 w-24 bg-primary rounded-full flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <User className="md:w-12 md:h-12 w-10 h-10 text-white" />
              )}
            </div>

            <label
              className={`absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors ${
                isUploadingAvatar ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isUploadingAvatar ? (
                <div className="md:w-4 md:h-4 w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="md:w-4 md:h-4 w-3 h-3 " />
              )}
              <input
                title="image-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
                className="hidden"
              />
            </label>
            {/* No extra controls - upload button is floating on avatar */}
          </div>

          <h3 className="md:text-lg text-base font-semibold text-foreground mt-2">
            {user.username}
          </h3>
          <p className="md:text-sm text-xs  text-muted-foreground">
            {user.email}
          </p>
        </div>

        {/* Profile form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="md:space-y-4 space-y-3"
        >
          <Input
            label="Username"
            type="text"
            {...register("username", {
              required: "Username is required",
              minLength: {
                value: 3,
                message: "Username must be at least 3 characters",
              },
              maxLength: {
                value: 20,
                message: "Username must be less than 20 characters",
              },
            })}
            disabled={!isEditing}
            error={errors.username?.message}
            className="py-3 md:py-3.5 md:text-sm text-xs"
          />

          <Input
            label="Email"
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
            disabled={!isEditing}
            error={errors.email?.message}
            className="py-3 md:py-3.5 md:text-sm text-xs"
          />

          {/* Action buttons */}
          <div className="flex md:space-x-3 space-x-2 md:pt-4 pt-2">
            {!isEditing ? (
              <Button type="button" onClick={handleEdit} className="flex-1">
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isSaving}
                  disabled={!isDirty || isSaving}
                >
                  <Save className="md:w-4 md:h-4 w-3 h-3" />
                  <span>Save</span>
                </Button>
              </>
            )}
          </div>
        </form>

        {/* Account info */}
        <div className="md:mt-6 mt-4 md:pt-6 pt-4 border-t border-border">
          <div className="md:space-y-2 space-y-1 md:text-sm text-xs">
            <div className="flex justify-between ">
              <span className="text-muted-foreground">Account Status:</span>
              <span
                className={`font-medium ${
                  user.isVerified ? "text-muted-foreground" : "text-destructive"
                }`}
              >
                {user.isVerified ? "Verified" : "Unverified"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since:</span>
              <span className="text-foreground">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
