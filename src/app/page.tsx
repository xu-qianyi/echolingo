import { UrlInput } from "@/components/url-input"
import { LandingHeadline } from "@/components/landing-headline"

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 w-full">
        <LandingHeadline />
        <UrlInput />
      </div>
    </main>
  )
}
