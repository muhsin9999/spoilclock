// Bryntum's stylesheets, served from public/bryntum (see scripts/copy-bryntum.mjs).
export default function TodayLayout({ children }: LayoutProps<"/today">) {
  return (
    <>
      <link rel="stylesheet" href="/bryntum/scheduler.css" precedence="low" />
      <link rel="stylesheet" href="/bryntum/svalbard-light.css" precedence="low" />
      {children}
    </>
  );
}
