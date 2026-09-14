export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold text-red-400">۴۰۴</h1>
      <p className="text-slate-400">صفحه مورد نظر یافت نشد</p>
      <a href="/" className="text-blue-400 hover:text-blue-300 underline">
        بازگشت به داشبورد
      </a>
    </div>
  );
}
