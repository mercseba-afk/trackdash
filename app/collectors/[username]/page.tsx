import { SharedCollectionScreen } from "@/components/screens/shared-collection-screen"

export default async function CollectorShowcasePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return <SharedCollectionScreen username={decodeURIComponent(username)} />
}
