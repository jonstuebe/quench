import AppIntents
import Foundation
import HealthKit

@main
struct EntryExtension: AppIntentsExtension {}

// MARK: - Volume unit (Siri-friendly)

enum WaterVolumeUnit: String, AppEnum {
    case milliliters
    case liters
    case fluidOuncesUS
    case cupsUS
    case pintsUS

    static var typeDisplayRepresentation: TypeDisplayRepresentation {
        TypeDisplayRepresentation(name: "Volume unit")
    }

    static var caseDisplayRepresentations: [WaterVolumeUnit: DisplayRepresentation] = [
        .milliliters: "Milliliters",
        .liters: "Liters",
        .fluidOuncesUS: "Fluid ounces (US)",
        .cupsUS: "Cups (US)",
        .pintsUS: "Pints (US)",
    ]

    /// Convert to US fl oz for HealthKit (same as Quench’s JS layer).
    func toUsFluidOunces(_ value: Double) -> Double {
        switch self {
        case .milliliters:
            Measurement(value: value, unit: UnitVolume.milliliters).converted(to: .fluidOunces).value
        case .liters:
            Measurement(value: value, unit: UnitVolume.liters).converted(to: .fluidOunces).value
        case .fluidOuncesUS:
            value
        case .cupsUS:
            Measurement(value: value, unit: UnitVolume.cups).converted(to: .fluidOunces).value
        case .pintsUS:
            Measurement(value: value, unit: UnitVolume.pints).converted(to: .fluidOunces).value
        }
    }
}

// MARK: - Log water

struct LogWaterIntent: AppIntent {
    static var title: LocalizedStringResource { "Log water" }

    static var description: IntentDescription {
        IntentDescription("Log water to Apple Health. Say a number and a unit (for example 12 fluid ounces or 500 milliliters).")
    }

    static var openAppWhenRun: Bool = false

    @Parameter(title: "Amount", requestValueDialog: IntentDialog("What number? For example 12 or 500."))
    var value: Double

    @Parameter(
        title: "Unit",
        default: .fluidOuncesUS,
        requestValueDialog: IntentDialog("Which unit? For example fluid ounces or milliliters.")
    )
    var unit: WaterVolumeUnit

    static var parameterSummary: some ParameterSummary {
        Summary("Log \(\.$value) \(\.$unit) of water") {
            \.$value
            \.$unit
        }
    }

    func perform() async throws -> some IntentResult {
        guard value > 0 else {
            throw LogWaterError.invalidAmount
        }

        let healthStore = HKHealthStore()
        guard HKHealthStore.isHealthDataAvailable() else {
            throw LogWaterError.healthDataUnavailable
        }

        guard let waterType = HKQuantityType.quantityType(forIdentifier: .dietaryWater) else {
            throw LogWaterError.healthDataUnavailable
        }

        try await healthStore.requestAuthorization(toShare: [waterType], read: [])

        let status = healthStore.authorizationStatus(for: waterType)
        guard status == .sharingAuthorized else {
            throw LogWaterError.notAuthorized
        }

        let flOz = unit.toUsFluidOunces(value)
        let quantity = HKQuantity(unit: HKUnit.fluidOunceUS(), doubleValue: flOz)
        let now = Date()
        let sample = HKQuantitySample(type: waterType, quantity: quantity, start: now, end: now)

        do {
            try await healthStore.save(sample)
        } catch {
            throw LogWaterError.saveFailed
        }

        let measurement = Measurement(value: value, unit: unit.measurementUnit).converted(to: .fluidOunces)
        let formatted = measurement.formatted(.measurement(width: .abbreviated, usage: .asProvided))

        return .result(
            dialog: IntentDialog("Logged \(formatted) of water in Health.")
        )
    }
}

private extension WaterVolumeUnit {
    var measurementUnit: UnitVolume {
        switch self {
        case .milliliters: .milliliters
        case .liters: .liters
        case .fluidOuncesUS: .fluidOunces
        case .cupsUS: .cups
        case .pintsUS: .pints
        }
    }
}

// MARK: - Shortcuts / Siri phrases

struct QuenchAppShortcuts: AppShortcutsProvider {
    @AppShortcutsBuilder
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: LogWaterIntent(),
            phrases: [
                "Log water in \(.applicationName)",
                "Record water in \(.applicationName)",
            ],
            shortTitle: "Log water",
            systemImageName: "drop.fill"
        )
    }
}

// MARK: - Errors

enum LogWaterError: Error, CustomLocalizedStringResourceConvertible {
    case invalidAmount
    case healthDataUnavailable
    case notAuthorized
    case saveFailed

    var localizedStringResource: LocalizedStringResource {
        switch self {
        case .invalidAmount:
            "Choose an amount greater than zero."
        case .healthDataUnavailable:
            "Health data isn’t available on this device."
        case .notAuthorized:
            "Open Quench and allow access to Health to log water."
        case .saveFailed:
            "Couldn’t save this to Health. Try again."
        }
    }
}
