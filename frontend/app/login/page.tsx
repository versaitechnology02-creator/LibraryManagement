import { LoginForm } from "@/components/login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const params = await searchParams
  const redirectToParam = params?.redirect
  const redirectTo = typeof redirectToParam === "string" ? redirectToParam : undefined

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  )
}

