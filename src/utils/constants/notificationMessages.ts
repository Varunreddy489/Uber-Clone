export const notificationMessages = {
  USER_REGISTERED: (name: string) => ({
    title: "Welcome aboard!",
    message: `Welcome aboard, ${name}! Your account has been created.`,
  }),

  LOGIN_SUCCESSFUL: () => ({
    title: "Login Successful",
    message: "You've logged in successfully.",
  }),

  FORGOT_PASSWORD: () => ({
    title: "OTP Sent",
    message: "OTP sent to your email/phone.",
  }),

  PASSWORD_RESET: () => ({
    title: "Password Updated",
    message: "Your password has been updated.",
  }),

  OTP_VERIFIED: () => ({
    title: "Identity Verified",
    message: "Your identity has been verified successfully.",
  }),

  // Ride Flow - User Side
  RIDE_REQUESTED: (
    distance: number,
    fare: number,
    destination: string,
    userLocation: string
  ) => ({
    title: "Ride Requested",
    message: `Your ride has been requested. Distance: ${distance} km. Fare: ₹${fare}. Destination: ${destination}. User Location: ${userLocation}.`,
  }),

  RIDE_ACCEPTED: (driverName: string) => ({
    title: "Driver Assigned",
    message: `Driver ${driverName} has accepted your ride`,
  }),

  RIDE_REJECTED: () => ({
    title: "Driver Rejected",
    message: "Driver rejected your request. Please try another time.",
  }),

  RIDE_CANCELED: () => ({
    title: "Ride Canceled",
    message: "Your Pickup has been canceled.",
  }),

  RIDE_TIMEOUT: () => ({
    title: "Driver is Busy",
    message: "Driver is Busy. Please try another time.",
  }),

  DRIVER_ARRIVED: () => ({
    title: "Driver Arrived",
    message: "Your driver has reached the pickup location.",
  }),

  RIDE_STARTED: (destination: string) => ({
    title: "Ride Started",
    message: `Enjoy your ride to ${destination}.`,
  }),

  RIDE_COMPLETED: (amount: number) => ({
    title: "Ride Completed",
    message: `Your trip has ended. Fare: ₹${amount}.`,
  }),

  // Driver Side
  NEW_RIDE_REQUEST: (userName: string, pickup: string) => ({
    title: "New Ride Request",
    message: `You have a new ride request from ${userName} at ${pickup}.`,
  }),

  DRIVER_VERIFIED: () => ({
    title: "Profile Verified",
    message: "Your documents have been verified. You can now accept rides.",
  }),

  // Payment & Wallet
  USER_PAYMENT_SUCCESS_NO: (amount: number) => ({
    title: "Payment Successful",
    message: `Payment of ₹${amount} completed for ride.`,
  }),

  DRIVER_PAYMENT_SUCCESS_NO: (amount: number) => ({
    title: "Payment Received",
    message: `Your payment of ₹${amount} has been received.`,
  }),

  WALLET_TOPUP_SUCCESS: (amount: number) => ({
    title: "Wallet Recharged",
    message: `₹${amount} added to your wallet.`,
  }),
};
