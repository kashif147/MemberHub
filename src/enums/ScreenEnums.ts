export const STACKS = {
  HOME: 'Home',
  HOME_MAIN: 'HomeMain',
  MEMBERSHIP_DRIVE: 'MembershipDrive',
  CREATE_DRIVE: 'CreateDrive',
  APPLICATION_FORM: 'ApplicationForm',
  MY_DRIVES: 'MyDrives',
  DRIVE_DETAILS: 'DriveDetails',
  MEMBERS: 'Members',
  MEMBERS_LIST: 'MembersList',
  MEMBER_DETAIL: 'MemberDetail',
  CASES: 'Cases',
  CASES_LIST: 'CasesList',
  NEW_CASE: 'NewCase',
  CASE_DETAIL: 'CaseDetail',
  MORE: 'More',
  MORE_MAIN: 'MoreMain',
  NOTIFICATIONS: 'Notifications',
  SETTINGS: 'Settings',
  SPLASH: 'Splash',
  LANDING: 'Landing',
} as const;

export type StackName = (typeof STACKS)[keyof typeof STACKS];
