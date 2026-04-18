export const metadata = {
  title: "👦KENTO36🔥レベルUPアプリ🔥",
  description: "野球練習トラッキングアプリ",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
