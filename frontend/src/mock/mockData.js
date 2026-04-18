// This file contains dummy data based on the provided schema

export const mockInvestigations = [
  {
    case_id: "CASE-2026-001",
    anomaly_type: "GHOST_BENEFICIARY",
    target_entity: {
      entity_type: "USER",
      entity_id: "USR-GJ-001"
    },
    status: "VERIFICATION_SUBMITTED",
    workflow: {
      assigned_dfo_id: "OFF-1042",
      assigned_verifier_id: "OFF-2099",
      assigned_auditor_id: "OFF-3011"
    },
    field_report: {
      photo_evidence_url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800",
      gps_coordinates: {
        lat: 23.0225,
        lng: 72.5714
      },
      verifier_notes: "Student verified at residence. Identity confirmed via Aadhaar.",
      ai_verification_match: true,
      ai_analysis: {
        confidence_score: 98,
        reason: "The submitted photo perfectly matches the registered Aadhaar image. GPS tags align with the beneficiary's registered address.",
        proofs: [
          "Facial landmarks match existing KYC profile.",
          "GPS coordinates are within 15 meters of the registered permanent address.",
          "No deepfake signatures detected."
        ]
      },
      submission_timestamp: "2026-04-18T10:00:00Z"
    },
    audit_report: null
  },
  {
    case_id: "CASE-2026-002",
    anomaly_type: "DUPLICATE_IDENTITY",
    target_entity: {
      entity_type: "USER",
      entity_id: "USR-GJ-045"
    },
    status: "VERIFICATION_SUBMITTED",
    workflow: {
      assigned_dfo_id: "OFF-1042",
      assigned_verifier_id: "OFF-2104",
      assigned_auditor_id: "OFF-3011"
    },
    field_report: {
      photo_evidence_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800",
      gps_coordinates: {
        lat: 22.3039,
        lng: 70.8022
      },
      verifier_notes: "Beneficiary not found at registered address. Suspected fake identity. Provided alternative person for photo.",
      ai_verification_match: false,
      ai_analysis: {
        confidence_score: 12,
        reason: "Significant facial mismatch. The person in the evidence photo does not correspond to the KYC database. Furthermore, the GPS signature of the photo indicates it was taken in a different district.",
        proofs: [
          "Facial geometry mismatch: Expected female (16y), identified male (~45y).",
          "GPS coordinates are 142km away from the registered school.",
          "EXIF metadata indicates the photo was taken from a printed paper, not a live person (screen-capture detected)."
        ]
      },
      submission_timestamp: "2026-04-17T15:30:00Z"
    },
    audit_report: null
  }
];

export const mockUsers = [
  {
    user_id: "USR-GJ-001",
    full_name: "Karan Patel",
    aadhaar_hash: "a8f5f167f44f4964...",
    demographics: {
      district: "Ahmedabad",
      taluka: "Sanand",
      gender: "M",
      dob: "2006-05-14"
    },
    kyc_profile: {
      is_kyc_compliant: true,
      last_kyc_date: "2026-03-01T10:00:00Z",
      kyc_expiry_date: "2026-06-01T10:00:00Z",
      dynamic_validity_days: 90,
      kyc_method: "BIOMETRIC_OR_OTP"
    },
    registered_schemes: [
      {
        scheme_id: "SCH-MGMS",
        status: "ACTIVE",
        registration_date: "2025-08-15"
      }
    ]
  }
];

// Named export used by src/api.js as fallback for user data
export const mockData = {
  user: mockUsers[0] || null,
}
