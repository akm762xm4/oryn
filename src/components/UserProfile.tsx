import { useState } from "react";
import { X, Camera, Save, User } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useForm } from "react-hook-form";
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
  const { user, login } = useAuthStore();

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

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await api.post("/auth/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedUser = { ...user, avatar: response.data.avatarUrl };
      login(localStorage.getItem("token") || "", updatedUser);

      toast.success("Avatar updated successfully");
    } catch {
      toast.error("Failed to upload avatar");
    }

    // Reset file input
    e.target.value = "";
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Profile Settings
          </h2>
          <button
            title="close"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Avatar section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>

              <label className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  title="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-3">
              {user.username}
            </h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* Profile form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <input
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
                className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background border border-transparent focus:border-primary disabled:opacity-50"
              />
              {errors.username && (
                <p className="text-destructive text-sm mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background border border-transparent focus:border-primary disabled:opacity-50"
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3 pt-4">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-2 px-4 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isDirty || isSaving}
                    className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Account info */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Status:</span>
                <span
                  className={`font-medium ${
                    user.isVerified ? "text-accent" : "text-destructive"
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
      </div>
    </div>
  );
}
