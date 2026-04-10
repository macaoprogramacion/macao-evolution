// ─── GetYourGuide Supplier API Types ────────────────────────────────────────
// Based on OpenAPI spec v1.0 (supplier-api-supplier-endpoints)

// ─── Ticket Categories ──────────────────────────────────────────────────────
export type TicketCategory =
  | "ADULT"
  | "CHILD"
  | "YOUTH"
  | "INFANT"
  | "SENIOR"
  | "STUDENT"
  | "EU_CITIZEN"
  | "MILITARY"
  | "EU_CITIZEN_STUDENT"
  | "GROUP"

export type TicketCategoryCollective = TicketCategory | "COLLECTIVE"

export type TicketCodeType =
  | "TEXT"
  | "BARCODE_CODE39"
  | "BARCODE_CODE128"
  | "QR_CODE"
  | "DATA_MATRIX"
  | "EAN_13"
  | "ITF"
  | "AZTEC"

// ─── Error Codes ────────────────────────────────────────────────────────────
export type GygErrorCode =
  | "AUTHORIZATION_FAILURE"
  | "INVALID_PRODUCT"
  | "VALIDATION_FAILURE"
  | "INTERNAL_SYSTEM_FAILURE"
  | "NO_AVAILABILITY"
  | "INVALID_TICKET_CATEGORY"
  | "INVALID_PARTICIPANTS_CONFIGURATION"
  | "INVALID_RESERVATION"
  | "INVALID_BOOKING"
  | "BOOKING_REDEEMED"
  | "BOOKING_IN_PAST"
  | "BOOKING_ALREADY_CANCELED"

export interface GygError {
  errorCode: GygErrorCode
  errorMessage: string
  participantsConfiguration?: { min: number; max: number | null }
  groupConfiguration?: { max: number }
  ticketCategory?: string
}

// ─── Availability ───────────────────────────────────────────────────────────
export interface AvailabilityQueryParams {
  productId: string
  fromDateTime: string
  toDateTime: string
}

export interface OpeningTime {
  fromTime: string
  toTime: string
}

export interface RetailPrice {
  category: TicketCategory
  price: number // smallest currency unit, e.g. 1000 = $10.00
}

export interface AvailabilityItem {
  productId: string
  dateTime: string
  vacancies: number
  cutoffSeconds?: number
  openingTimes?: OpeningTime[]
  currency?: string
  pricesByCategory?: {
    retailPrices: RetailPrice[]
  }
}

export interface AvailabilityResponse {
  data: {
    availabilities: AvailabilityItem[]
  }
}

// ─── Reservation ────────────────────────────────────────────────────────────
export interface ReservationBookingItem {
  category: TicketCategory
  count: number
  groupSize?: number
}

export interface ReservationRequest {
  data: {
    productId: string
    dateTime: string
    bookingItems: ReservationBookingItem[]
    gygBookingReference: string
    gygActivityReference?: string
  }
}

export interface ReservationResponse {
  data: {
    reservationReference: string
    reservationExpiration: string
  }
}

// ─── Reservation Cancellation ───────────────────────────────────────────────
export interface ReservationCancellationRequest {
  data: {
    gygBookingReference: string
    reservationReference: string
    gygActivityReference?: string
  }
}

// ─── Booking ────────────────────────────────────────────────────────────────
export interface BookingItem {
  category: TicketCategory
  count: number
  groupSize?: number
  retailPrice: number
}

export interface AddonItem {
  addonType: "FOOD" | "DRINKS" | "SAFETY" | "TRANSPORT" | "DONATION" | "OTHERS"
  addonDescription?: string
  count: number
  retailPrice: number
}

export interface Traveler {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
}

export interface BookingRequest {
  data: {
    productId: string
    reservationReference: string
    gygBookingReference: string
    gygActivityReference?: string
    currency: string
    dateTime: string
    bookingItems: BookingItem[]
    addonItems?: AddonItem[]
    language?: string
    travelers: Traveler[]
    travelerHotel?: string
    comment: string
  }
}

export interface Ticket {
  category: TicketCategoryCollective
  ticketCode: string
  ticketCodeType: TicketCodeType
}

export interface BookingResponse {
  data: {
    bookingReference: string
    tickets: Ticket[]
  }
}

// ─── Booking Cancellation ───────────────────────────────────────────────────
export interface BookingCancellationRequest {
  data: {
    bookingReference: string
    gygBookingReference: string
    productId: string
  }
}

// ─── Empty Success ──────────────────────────────────────────────────────────
export interface EmptySuccessResponse {
  data: Record<string, never>
}

// ─── Notification (inbound from GYG) ────────────────────────────────────────
export interface NotificationRequest {
  data: {
    notificationType: "PRODUCT_DEACTIVATION"
    description: string
    supplierName: string
    integrationName: string
    productDetails: {
      productId: string
      gygTourOptionId: string
      tourOptionTitle: string
    }
    notificationDetails: {
      failedRequestType: string
      deactivationTimestamp: string
      gygBookingReference: string
      travellers: string
      errorType: string
      errorMessageReceived: string
      vacanciesReceivedAfterGetAvailability: string
      activityStartTime: string
      activityTimeZone: string
    }
    dateTime: string
  }
}
