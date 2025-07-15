import * as md5 from 'md5'

interface SignatureData {
  click_trans_id: string
  service_id: string
  orderId: string
  merchant_prepare_id?: string
  amount: string
  action: string
  sign_time: string
}

const clickCheckToken = (data: SignatureData, signString: string): boolean => {
  const { click_trans_id, service_id, orderId, merchant_prepare_id, amount, action, sign_time } = data
  const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY
  const prepareId = merchant_prepare_id || ''
  const signature = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${orderId}${prepareId}${amount}${action}${sign_time}`
  const signatureHash = md5(signature)
  return signatureHash === signString
}

export default clickCheckToken
