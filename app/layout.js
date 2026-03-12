export const metadata = {
  title: "Gym Tracker",
  description: "Track workouts and weight"
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
