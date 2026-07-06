export type SportId = 'rugby'

export type SportOption = {
  id: SportId
  label: string
}

export type PositionGroupOption<TGroup extends string = string> = {
  value: TGroup
  label: string
}

export type AthleteLabels = {
  genericName: 'Athlete'
  displayName: string
  pluralDisplayName: string
  positionLabel: string
  positionGroupLabel: string
}

export type SportConfig<TGroup extends string = string> = {
  sportId: SportId
  productLabel: string
  athleteLabels: AthleteLabels
  positionGroups: readonly PositionGroupOption<TGroup>[]
  sessionTypeLabels: Record<string, string>
  metricLabels: Record<string, string>
  trafficLightLabels: {
    green: string
    yellow: string
    red: string
  }
  reconditioningLabels: {
    boardLabel: string
    statusLabel: string
    capCategories: readonly string[]
  }
  libraryCategoryLabels: readonly string[]
  safetyCopy: {
    coachBoundary: string
    publicCheckInPrivacy: string
  }
}
