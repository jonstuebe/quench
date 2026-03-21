/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "app-intent",
  name: "QuenchLogWater",
  displayName: "Quench Log Water",
  frameworks: ["AppIntents", "HealthKit"],
  deploymentTarget: "17.0",
  entitlements: {
    "com.apple.developer.healthkit": true,
    "com.apple.developer.healthkit.background-delivery": true,
  },
});
