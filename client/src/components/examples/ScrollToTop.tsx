import ScrollToTop from "../ScrollToTop";

export default function ScrollToTopExample() {
  return (
    <div className="h-[200vh] p-8">
      <h1 className="text-2xl font-bold">Scroll down to see the button</h1>
      <p className="text-muted-foreground">The button will appear when you scroll down</p>
      <ScrollToTop />
    </div>
  );
}
