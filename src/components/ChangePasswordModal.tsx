import { useForm } from "react-hook-form";
import { Modal, Input, Button } from "./ui";
import api from "../lib/api";
import toast from "react-hot-toast";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordForm>();

  const newPassword = watch("newPassword");

  const onSubmit = async (data: ChangePasswordForm) => {
    try {
      await api.post("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully");
      reset();
      onClose();
    } catch (error) {
      toast.error("Failed to change password");
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Password"
      size="md"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="md:space-y-4 space-y-3"
      >
        <Input
          label="Current password"
          type="password"
          {...register("currentPassword", {
            required: "Current password is required",
          })}
          error={errors.currentPassword?.message}
          className="md:py-3.5 py-3 md:text-sm text-xs"
        />

        <Input
          label="New password"
          type="password"
          {...register("newPassword", {
            required: "New password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
          error={errors.newPassword?.message}
          className="md:py-3.5 py-3 md:text-sm text-xs"
        />

        <Input
          label="Confirm new password"
          type="password"
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) =>
              value === newPassword || "Passwords do not match",
          })}
          error={errors.confirmPassword?.message}
          className="md:py-3.5 py-3 md:text-sm text-xs"
        />

        <div className="flex justify-end gap-2 md:pt-2 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Update
          </Button>
        </div>
      </form>
    </Modal>
  );
}
