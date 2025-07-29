import { Avatar } from '@/app/components/avatar'
import { Badge } from '@/app/components/badge'
import { Button } from '@/app/components/button'
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/app/components/description-list'
import { Divider } from '@/app/components/divider'
import { Heading, Subheading } from '@/app/components/heading'
import { Link } from '@/app/components/link'
import { getOrder } from '@/data'
import {
  BanknotesIcon,
  CalendarIcon,
  ChevronLeftIcon,
  CreditCardIcon,
} from '@heroicons/react/16/solid'
import { RequestInfo } from 'rwsdk/worker'
import { RefundOrder } from './refund'

export default async function Order({ params }: RequestInfo) {
  const id = params.id as string
  const order = await getOrder(id)

  if (!order) {
    return <div>Order not found</div>
  }

  return (
    <>
      <div className="max-lg:hidden">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm/6 text-base-500 dark:text-base-400"
        >
          <ChevronLeftIcon className="size-4 fill-base-400 dark:fill-base-500" />
          Orders
        </Link>
      </div>
      <div className="mt-4 lg:mt-8">
        <div className="flex items-center gap-4">
          <Heading>Order #{order.id}</Heading>
          <Badge color="lime">Successful</Badge>
        </div>
        <div className="isolate mt-2.5 flex flex-wrap justify-between gap-x-6 gap-y-4">
          <div className="flex flex-wrap gap-x-10 gap-y-4 py-1.5">
            <span className="flex items-center gap-3 text-base/6 text-base-950 sm:text-sm/6 dark:text-base-50">
              <BanknotesIcon className="size-4 shrink-0 fill-base-400 dark:fill-base-500" />
              <span>US{order.amount.usd}</span>
            </span>
            <span className="flex items-center gap-3 text-base/6 text-base-950 sm:text-sm/6 dark:text-base-50">
              <CreditCardIcon className="size-4 shrink-0 fill-base-400 dark:fill-base-500" />
              <span className="inline-flex gap-3">
                {order.payment.card.type}{' '}
                <span>
                  <span aria-hidden="true">••••</span> {order.payment.card.number}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-3 text-base/6 text-base-950 sm:text-sm/6 dark:text-base-50">
              <CalendarIcon className="size-4 shrink-0 fill-base-400 dark:fill-base-500" />
              <span>{order.date}</span>
            </span>
          </div>
          <div className="flex gap-4">
            <RefundOrder outline amount={order.amount.usd}>
              Refund
            </RefundOrder>
            <Button>Resend Invoice</Button>
          </div>
        </div>
      </div>
      <div className="mt-12">
        <Subheading>Summary</Subheading>
        <Divider className="mt-4" />
        <DescriptionList>
          <DescriptionTerm>Customer</DescriptionTerm>
          <DescriptionDetails>{order.customer.name}</DescriptionDetails>
          <DescriptionTerm>Event</DescriptionTerm>
          <DescriptionDetails>
            <Link href={order.event.url} className="flex items-center gap-2">
              <Avatar src={order.event.thumbUrl} className="size-6" />
              <span>{order.event.name}</span>
            </Link>
          </DescriptionDetails>
          <DescriptionTerm>Amount</DescriptionTerm>
          <DescriptionDetails>US{order.amount.usd}</DescriptionDetails>
          <DescriptionTerm>Amount after exchange rate</DescriptionTerm>
          <DescriptionDetails>
            US{order.amount.usd} &rarr; CA{order.amount.cad}
          </DescriptionDetails>
          <DescriptionTerm>Fee</DescriptionTerm>
          <DescriptionDetails>CA{order.amount.fee}</DescriptionDetails>
          <DescriptionTerm>Net</DescriptionTerm>
          <DescriptionDetails>CA{order.amount.net}</DescriptionDetails>
        </DescriptionList>
      </div>
      <div className="mt-12">
        <Subheading>Payment method</Subheading>
        <Divider className="mt-4" />
        <DescriptionList>
          <DescriptionTerm>Transaction ID</DescriptionTerm>
          <DescriptionDetails>{order.payment.transactionId}</DescriptionDetails>
          <DescriptionTerm>Card number</DescriptionTerm>
          <DescriptionDetails>•••• {order.payment.card.number}</DescriptionDetails>
          <DescriptionTerm>Card type</DescriptionTerm>
          <DescriptionDetails>{order.payment.card.type}</DescriptionDetails>
          <DescriptionTerm>Card expiry</DescriptionTerm>
          <DescriptionDetails>{order.payment.card.expiry}</DescriptionDetails>
          <DescriptionTerm>Owner</DescriptionTerm>
          <DescriptionDetails>{order.customer.name}</DescriptionDetails>
          <DescriptionTerm>Email address</DescriptionTerm>
          <DescriptionDetails>{order.customer.email}</DescriptionDetails>
          <DescriptionTerm>Address</DescriptionTerm>
          <DescriptionDetails>{order.customer.address}</DescriptionDetails>
          <DescriptionTerm>Country</DescriptionTerm>
          <DescriptionDetails>
            <span className="inline-flex gap-3">
              <img src={order.customer.countryFlagUrl} alt={order.customer.country} />
              {order.customer.country}
            </span>
          </DescriptionDetails>
          <DescriptionTerm>CVC</DescriptionTerm>
          <DescriptionDetails>
            <Badge color="lime">Passed successfully</Badge>
          </DescriptionDetails>
        </DescriptionList>
      </div>
    </>
  )
}
