import { VideoLayout } from "./video-layout"

interface Props {
  params: Promise<{ videoId: string }>
}

export default async function WatchPage({ params }: Props) {
  const { videoId } = await params
  return <VideoLayout videoId={videoId} />
}
