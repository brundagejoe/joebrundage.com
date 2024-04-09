import { Button } from "~/shadcn-ui-components/ui/button"
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "~/shadcn-ui-components/ui/dialog"

export default function Dialog({
  title,
  submitText,
  onSubmit,
  Trigger,
  Content,
}: {
  title?: string
  submitText?: string
  onSubmit?: () => void
  Trigger: React.ReactNode
  Content: React.ReactNode
}) {
  return (
    <ShadcnDialog>
      <DialogTrigger>{Trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          <DialogDescription>{Content}</DialogDescription>
        </DialogHeader>
        {submitText && (
          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={onSubmit}>{submitText}</Button>
            </DialogClose>
          </DialogFooter>
        )}
      </DialogContent>
    </ShadcnDialog>
  )
}
