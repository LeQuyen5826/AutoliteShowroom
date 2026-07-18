import { useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { carsService } from '@/services/cars.service'
import { ordersService } from '@/services/orders.service'
import { formatPrice } from '@/utils'
import { ChevronRight, Car, Loader2, CheckCircle } from 'lucide-react'

export default function OrderPage() {
  const { carId } = useParams<{ carId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const type = (searchParams.get('type') || 'purchase') as 'deposit' | 'purchase'

  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ id: string } | null>(null)
  const [error, setError] = useState('')

  const { data: car, isLoading } = useQuery({
    queryKey: ['car', carId],
    queryFn: () => carsService.getById(carId!),
    enabled: !!carId,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!car) return
    setError('')
    setLoading(true)
    try {
      const order = await ordersService.create({ car_id: car.id, type, notes })
      setSuccess(order)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Đặt hàng thất bại, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-96">
      <Loader2 size={32} className="animate-spin text-primary-600" />
    </div>
  )

  if (!car) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-neutral-500">Không tìm thấy xe.</p>
    </div>
  )

  // Thành công
  if (success) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="card p-10">
        <CheckCircle size={52} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="font-display font-bold text-2xl text-neutral-900 mb-2">Đặt hàng thành công!</h2>
        <p className="text-neutral-500 text-sm mb-6">
          Đơn hàng của bạn đã được tạo. Nhân viên sẽ liên hệ xác nhận trong thời gian sớm nhất.
        </p>
        <div className="bg-neutral-50 rounded-xl p-4 text-left mb-6 text-sm">
          <div className="flex justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-500">Xe</span>
            <span className="font-medium">{car.brand} {car.model} {car.year}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-500">Loại</span>
            <span className="font-medium">{type === 'deposit' ? 'Đặt cọc' : 'Mua xe'}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-neutral-500">Tổng tiền</span>
            <span className="font-bold text-accent">{formatPrice(car.price)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/orders')} className="btn-primary flex-1">Xem đơn hàng</button>
          <Link to="/" className="btn-secondary flex-1">Về trang chủ</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
        <Link to="/cars" className="hover:text-neutral-700">Xe</Link>
        <ChevronRight size={14} />
        <Link to={`/cars/${car.id}`} className="hover:text-neutral-700">{car.brand} {car.model}</Link>
        <ChevronRight size={14} />
        <span className="text-neutral-900">{type === 'deposit' ? 'Đặt cọc' : 'Mua xe'}</span>
      </nav>

      <h1 className="font-display font-bold text-2xl text-neutral-900 mb-6">
        {type === 'deposit' ? 'Đặt cọc xe' : 'Mua xe'}
      </h1>

      <div className="grid gap-6">
        {/* Thông tin xe */}
        <div className="card p-5 flex gap-4">
          <div className="w-20 h-16 bg-neutral-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
            {car.images?.[0]?.url
              ? <img src={car.images[0].url} alt="" className="w-full h-full object-cover" />
              : <Car size={24} className="text-neutral-400" />
            }
          </div>
          <div>
            <p className="text-xs text-primary-600 font-medium mb-0.5">{car.brand}</p>
            <p className="font-display font-semibold text-neutral-900">{car.model} {car.year}</p>
            <p className="text-sm text-neutral-500">{car.fuel_type} · {car.transmission}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-neutral-400">Giá</p>
            <p className="font-display font-bold text-accent">{formatPrice(car.price)}</p>
          </div>
        </div>

        {/* Form */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-neutral-900 mb-5">Xác nhận thông tin</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Loại giao dịch</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'deposit', label: 'Đặt cọc', desc: 'Giữ xe, thanh toán sau' },
                  { value: 'purchase', label: 'Mua xe', desc: 'Thanh toán đầy đủ' },
                ].map(opt => (
                  <div
                    key={opt.value}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      type === opt.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                    onClick={() => navigate(`/order/${car.id}?type=${opt.value}`)}
                  >
                    <p className="font-medium text-sm text-neutral-900">{opt.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Ghi chú (tuỳ chọn)</label>
              <textarea
                className="input resize-none h-24"
                placeholder="Yêu cầu đặc biệt, màu sắc, phụ kiện..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* Tóm tắt */}
            <div className="bg-neutral-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Xe</span>
                <span className="font-medium">{car.brand} {car.model} {car.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Loại</span>
                <span className="font-medium">{type === 'deposit' ? 'Đặt cọc' : 'Mua xe'}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 mt-2">
                <span className="font-semibold">Tổng tiền</span>
                <span className="font-bold text-accent text-base">{formatPrice(car.price)}</span>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Đang xử lý...' : `Xác nhận ${type === 'deposit' ? 'đặt cọc' : 'mua xe'}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
