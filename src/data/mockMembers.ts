export type MemberStatus = 'Active' | 'Lapsed' | 'Resigned';

export type Member = {
  id: string;
  initials: string;
  name: string;
  memberNo: string;
  role: string;
  branch: string;
  status: MemberStatus;
  arrears: string | null;
  joined?: string;
  paymentMethod?: string;
  grade?: string;
};

export const MEMBERS: Member[] = [
  {
    id: '1',
    initials: 'AB',
    name: 'Aoife Brennan',
    memberNo: 'B00114',
    role: 'Staff Nurse',
    branch: 'Beaumont ED',
    status: 'Active',
    arrears: null,
    joined: 'Mar 2018',
    paymentMethod: 'Direct debit',
    grade: 'General (all grades)',
  },
  {
    id: '2',
    initials: 'CD',
    name: 'Ciarán Doyle',
    memberNo: 'B00237',
    role: 'CNM2',
    branch: 'Beaumont ED',
    status: 'Active',
    arrears: '€61.40',
    joined: 'Jun 2011',
    paymentMethod: 'Direct debit',
    grade: 'General (all grades)',
  },
  {
    id: '3',
    initials: 'SM',
    name: 'Sinéad Murphy',
    memberNo: 'B00302',
    role: 'Staff Midwife',
    branch: 'Beaumont Maternity',
    status: 'Lapsed',
    arrears: null,
    joined: 'Jan 2015',
    paymentMethod: 'Direct debit',
    grade: 'Midwifery',
  },
  {
    id: '4',
    initials: 'TW',
    name: 'Tomás Walsh',
    memberNo: 'B00419',
    role: 'Staff Nurse',
    branch: 'Beaumont ICU',
    status: 'Active',
    arrears: null,
    joined: 'Sep 2019',
    paymentMethod: 'Direct debit',
    grade: 'General (all grades)',
  },
  {
    id: '5',
    initials: 'GO',
    name: 'Grace Okafor',
    memberNo: 'B00512',
    role: 'Clinical Nurse Specialist',
    branch: 'Mater Oncology',
    status: 'Active',
    arrears: null,
    joined: 'Apr 2016',
    paymentMethod: 'Direct debit',
    grade: 'CNS',
  },
  {
    id: '6',
    initials: 'MS',
    name: 'Maria Santos',
    memberNo: 'B00588',
    role: 'Staff Nurse',
    branch: 'Mater 4B',
    status: 'Active',
    arrears: '€30.70',
    joined: 'Nov 2017',
    paymentMethod: 'Direct debit',
    grade: 'General (all grades)',
  },
  {
    id: '7',
    initials: 'EB',
    name: 'Eoin Byrne',
    memberNo: 'B00640',
    role: 'CNM1',
    branch: 'Mater OPD',
    status: 'Resigned',
    arrears: null,
    joined: 'Feb 2012',
    paymentMethod: 'Direct debit',
    grade: 'General (all grades)',
  },
  {
    id: '8',
    initials: 'PV',
    name: 'Priya Varma',
    memberNo: 'B00712',
    role: 'Staff Nurse',
    branch: 'Beaumont ED',
    status: 'Active',
    arrears: null,
    joined: 'Jul 2020',
    paymentMethod: 'Direct debit',
    grade: 'General (all grades)',
  },
];

export const getMemberById = (id: string) =>
  MEMBERS.find(m => m.id === id) || null;
