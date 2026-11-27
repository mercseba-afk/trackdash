import SpeedChampionsLayout from "@/components/speed-champions/layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SpeedChampionsLayout locale="en">{children}</SpeedChampionsLayout>
}
