import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ month: string }>
}

export default async function PayrollMonthPage({ params }: Props) {
  const { month } = await params
  redirect(`/payroll?period=${month}`)
}
