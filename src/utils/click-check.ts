import * as md5 from 'md5';

interface SignatureData {
  click_trans_id: string;
  service_id: string;
  orderId: string;
  merchant_prepare_id?: string;
  amount: string;
  action: string;
  sign_time: string;
}

const clickCheckToken = (data: SignatureData, signString: string): boolean => {
  const {
    click_trans_id,
    service_id,
    orderId,
    merchant_prepare_id,
    amount,
    action,
    sign_time,
  } = data;
  const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY;

  let signature: string;
  if (parseInt(action) === 0) {
    // Prepare so‘rovi
    signature = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${orderId}${amount}${action}${sign_time}`;
  } else if (parseInt(action) === 1) {
    // Complete so‘rovi
    if (!merchant_prepare_id) {
      return false; // merchant_prepare_id majburiy
    }
    signature = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${orderId}${merchant_prepare_id}${amount}${action}${sign_time}`;
  } else {
    return false; // Noto‘g‘ri action
  }

  const signatureHash = md5(signature);
  return signatureHash === signString;
};

export default clickCheckToken;
