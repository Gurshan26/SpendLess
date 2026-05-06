import SpendLensApp from '@/components/SpendLensApp'

export default function HomePage() {
  return <SpendLensApp aiEnabled={Boolean(process.env.GEMINI_API_KEY)} />
}
