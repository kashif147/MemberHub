export type CaseStatus = 'In progress' | 'Open' | 'Closed';

export type CaseItem = {
  id: string;
  category: string;
  title: string;
  caseNo: string;
  member: string;
  memberId?: string;
  date: string;
  status: CaseStatus;
};

export const CASES: CaseItem[] = [
  {
    id: '1',
    category: 'PAY & CONDITIONS',
    title: 'Unpaid overtime – August roster',
    caseNo: 'CS-24018',
    member: 'Ciarán Doyle',
    memberId: '2',
    date: '12 Sep 2026',
    status: 'In progress',
  },
  {
    id: '2',
    category: 'HEALTH & SAFETY',
    title: 'ED staffing levels on nights',
    caseNo: 'CS-24031',
    member: 'Aoife Brennan',
    memberId: '1',
    date: '22 Sep 2026',
    status: 'Open',
  },
  {
    id: '3',
    category: 'WORKPLACE ISSUE',
    title: 'Annual leave refusal',
    caseNo: 'CS-23977',
    member: 'Maria Santos',
    memberId: '6',
    date: '28 Aug 2026',
    status: 'Closed',
  },
  {
    id: '4',
    category: 'BULLYING & HARASSMENT',
    title: 'Conduct of shift lead',
    caseNo: 'CS-24040',
    member: 'Tomás Walsh',
    memberId: '4',
    date: '26 Sep 2026',
    status: 'Open',
  },
];

export const getCasesForMember = (memberId: string) =>
  CASES.filter(c => c.memberId === memberId);
