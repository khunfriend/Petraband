import { Button } from "@/components/ui/Button";
import { googleSignInAction } from "@/app/(auth)/login/actions";

export function GoogleButton({ label }: { label: string }) {
  return (
    <form action={googleSignInAction}>
      <Button type="submit" variant="primary" className="w-full h-11">
        {label}
      </Button>
    </form>
  );
}
