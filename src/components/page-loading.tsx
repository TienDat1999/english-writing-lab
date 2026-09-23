export function PageLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="grid min-h-screen place-items-center bg-background px-5 text-foreground"
    >
      <div className="flex flex-col items-center text-center">
        <div className="page-loader" aria-hidden="true">
          <span className="page-loader-orbit" />
          <span className="page-loader-core">D</span>
        </div>
        <p className="mt-6 font-heading text-lg font-bold">Đang mở trang...</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Nội dung của bạn đang được chuẩn bị.
        </p>
      </div>
    </main>
  );
}
