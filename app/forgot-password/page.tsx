import { isRacingStudioPreview } from "@/lib/racing-studio"
import { redirect } from "next/navigation"
import { ForgotPasswordScreen } from "@/components/screens/forgot-password-screen"

export default function ForgotPasswordPage() {
  if (isRacingStudioPreview()) redirect("/login")
  return <ForgotPasswordScreen />
}
