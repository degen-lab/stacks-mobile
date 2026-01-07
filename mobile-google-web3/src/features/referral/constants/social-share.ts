// TODO: replace with the actual referral landing url
const REFERRAL_LANDING_URL = "https://stacks.co";

export const buildShareMessage = (referralCode: string) =>
  `Join me on Stacks Mobile! Use code ${referralCode} for 100 bonus points: ${REFERRAL_LANDING_URL}`;

export const socialShareTargets = (message: string) => {
  const encodedMessage = encodeURIComponent(message);
  const encodedUrl = encodeURIComponent(REFERRAL_LANDING_URL);

  return {
    x: `https://x.com/intent/tweet?text=${encodedMessage}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
    whatsapp: `https://wa.me/?text=${encodedMessage}`,
  } as const;
};

export { REFERRAL_LANDING_URL };
