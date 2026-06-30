// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  mapBox: {
    accessToken:
      'pk.eyJ1IjoiY2FyYTAxIiwiYSI6ImNtcXoxZnEyaDAxZXoycHM5a2k5NHlxaGwifQ.V-8yLbo0-ZXEiXbCKBPyKw',
  },
  stripe: {
    publishableKey:
      'pk_test_51TnwPRQumE0tRv6UzyiZSDYUcX9UGO6ILRSkvPr3FrRf4PkTL4XRL2sKmQ3uqkUwIndsdDA6NpElHdkpa4qEqyRQ00qh5nayh0',
  },
  paymentApiUrl: 'http://localhost:4000',
  paymentApiUrlAndroid: 'http://10.0.2.2:4000',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
