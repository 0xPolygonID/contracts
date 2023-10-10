import type { ID3CredentialSubject } from "@nexeraprotocol/nexera-id-schemas";

export const ID3_TEST_CREDENTIAL_SUBJECT1: ID3CredentialSubject = {
  id: "did:polygonid:polygon:mumbai:2qMVwDyePyv87dVSKXggJspKfdSUeXy46dbAGjEPau",
  journeyId: "123",
  amendmentsData: {
    authenticateSPResult: {
      AuthenticationID: "4d5c5eaa-0896-4865-bc9c-7dd23cbf7f0e",
      Timestamp: "2023-06-06T20:21:38.729Z",
      CustomerRef: "clientReference",
      ProfileID: "3957d286-79bb-4b9e-b320-0d0d71f756a3",
      ProfileName: "Test - PEPs & Sanctions",
      ProfileVersion: 1,
      ProfileRevision: 1,
      ProfileState: "Effective",
      ResultCodes: {
        GlobalItemCheckResultCodes: [
          {
            Name: "International Sanctions (Enhanced)",
            Description:
              "International Sanctions (Enhanced) check.  Provides authentication against multiple Sanctions and Enforcement lists across the globe (lists are selectable at profile level)",
            Match: {
              GlobalItemCheckResultCode: [
                {
                  Description: "Supplied full name did not match.",
                  Code: 3500,
                },
              ],
            },
            ID: 208,
            Pass: "NA",
            Address: "Nomatch",
            Forename: "Nomatch",
            Surname: "Nomatch",
            DOB: "Nomatch",
            Alert: "Nomatch",
            SanctionsMatches: {
              GlobalSanctionsMatch: [],
            },
          },
          {
            Name: "International PEP (Enhanced)",
            Description:
              "International PEP (Enhanced) Database check.  Provides authentication against Politically Exposed Persons lists from across the globe (contains known associates and known alias details)",
            Match: {
              GlobalItemCheckResultCode: [
                {
                  Description: "Supplied full name did not match.",
                  Code: 3500,
                },
                {
                  Description:
                    "Month of birth did not match for the full name.",
                  Code: 2106,
                },
                {
                  Description: "Year of birth did not match for the full name.",
                  Code: 2107,
                },
              ],
            },
            ID: 209,
            Pass: "NA",
            Address: "NA",
            Forename: "Nomatch",
            Surname: "Nomatch",
            DOB: "Nomatch",
            Alert: "Nomatch",
            SanctionsMatches: {
              GlobalSanctionsMatch: [],
            },
          },
        ],
      },
      Score: 0,
      BandText: "Pass",
      Country: "International",
    },
    pepIntelligenceResult: [],
    sanctionsEnforcementsResult: [],
  },
  originalData: {
    data: {
      citizenship: "DEU",
      documentType: "Passport",
      firstName: "ERIKA",
      lastName: "MUSTERMANN",
      gender: "FEMALE",
      age: "58",
      birthday: "1964-08-12",
    },
    authenticateSPResult: {
      AuthenticationID: "15f00d55-9874-451d-8181-622a0b8e0462",
      Timestamp: "2023-06-06T20:21:37.123Z",
      CustomerRef: "clientReference",
      ProfileID: "3957d286-79bb-4b9e-b320-0d0d71f756a3",
      ProfileName: "Test - PEPs & Sanctions",
      ProfileVersion: 1,
      ProfileRevision: 1,
      ProfileState: "Effective",
      ResultCodes: {
        GlobalItemCheckResultCodes: [
          {
            Name: "International Sanctions (Enhanced)",
            Description:
              "International Sanctions (Enhanced) check.  Provides authentication against multiple Sanctions and Enforcement lists across the globe (lists are selectable at profile level)",
            Match: {
              GlobalItemCheckResultCode: {
                Description: "Supplied full name did not match.",
                Code: 3500,
              },
            },
            ID: 208,
            Pass: "NA",
            Address: "Nomatch",
            Forename: "Nomatch",
            Surname: "Nomatch",
            DOB: "Nomatch",
            Alert: "Nomatch",
            SanctionsMatches: "",
          },
          {
            Name: "International PEP (Enhanced)",
            Description:
              "International PEP (Enhanced) Database check.  Provides authentication against Politically Exposed Persons lists from across the globe (contains known associates and known alias details)",
            Match: {
              GlobalItemCheckResultCode: [
                {
                  Description: "Supplied full name did not match.",
                  Code: 3500,
                },
                {
                  Description:
                    "Month of birth did not match for the full name.",
                  Code: 2106,
                },
                {
                  Description: "Year of birth did not match for the full name.",
                  Code: 2107,
                },
              ],
            },
            ID: 209,
            Pass: "NA",
            Address: "NA",
            Forename: "Nomatch",
            Surname: "Nomatch",
            DOB: "Nomatch",
            Alert: "Nomatch",
            SanctionsMatches: "",
          },
        ],
      },
      Score: 0,
      BandText: "Pass",
      Country: "International",
    },
    pepIntelligenceResult: [],
    sanctionsEnforcementsResult: [],
  },
  personalDetails: {
    documentType: "Passport",
    firstName: "ERIKA",
    lastName: "MUSTERMANN",
    gender: "FEMALE",
    addressLine1: "Line 1",
    placeOfBirth: "BERLIN",
    countryOfResidence: "AGO",
    age: "58",
    birthday: "1964-08-12",
    city: "BERLIN",
    countryOfBirth: "DEU",
    citizenship: "DEU",
  },
};

export const ID3_TEST_SUBJECT2: ID3CredentialSubject = {
  journeyId: "123",
  amendmentsData: {
    authenticateSPResult: {
      ProfileID: "789",
      ProfileName: "Profile",
      ProfileVersion: 1,
      ProfileRevision: 1,
      ProfileState: "Active",
      ResultCodes: {},
      ItemCheckDecisionBands: {},
      Country: "USA",
      AuthenticationID: "123",
      Timestamp: "2022-01-01T12:00:00Z",
      CustomerRef: "456",
      BandText: "Band",
      Score: 90,
    },
    sanctionsEnforcementsResult: [
      {
        Fullname: "John Doe",
      },
    ],
  },
  originalData: {
    authenticateSPResult: {
      ProfileID: "789",
      ProfileName: "Profile",
      ProfileVersion: 1,
      ProfileRevision: 1,
      ProfileState: "Active",
    },
    sanctionsEnforcementsResult: [
      {
        Fullname: "John Doe",
      },
    ],
  },
  personalDetails: {
    firstName: "John",
    lastName: "Doe",
  },
  id: "did:polygonid:polygon:mumbai:2qMVwDyePyv87dVSKXggJspKfdSUeXy46dbAGjEPau",
};
