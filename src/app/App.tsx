import { EmailComposer } from './components/EmailComposer';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <div className="size-full bg-background">
      <EmailComposer />
      <Toaster />
    </div>
  );
}