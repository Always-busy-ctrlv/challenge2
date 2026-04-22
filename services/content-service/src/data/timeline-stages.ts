import type { TimelineStage } from '@elect-ed/shared-types';

export const timelineStages: TimelineStage[] = [
  {
    id: 'voter-registration',
    order: 1,
    title: 'Voter Registration',
    slug: 'voter-registration',
    summary: 'The first step in exercising your right to vote. Learn about eligibility, deadlines, and how to register in your state.',
    icon: '📋',
    details: [
      {
        heading: 'Who Can Register?',
        content: 'You must be a U.S. citizen, meet your state\'s residency requirements, and be 18 years old by Election Day. Some states allow 16- and 17-year-olds to pre-register so they\'re ready to vote when they turn 18.',
      },
      {
        heading: 'How to Register',
        content: 'You can register online at vote.gov, by mail using the National Voter Registration Form, or in person at your local election office, DMV, or other public agencies. Some states offer same-day registration at polling places.',
      },
      {
        heading: 'Deadlines',
        content: 'Registration deadlines vary by state, ranging from 30 days before an election to same-day registration. Check your state\'s specific deadline to ensure your registration is processed in time.',
      },
      {
        heading: 'Checking Your Status',
        content: 'Already registered? You can verify your registration status online through your state\'s Secretary of State website. It\'s wise to check before every election to ensure your information is current.',
      },
    ],
    faqs: [
      {
        question: 'Can I register to vote if I\'ve moved recently?',
        answer: 'Yes! You\'ll need to update your registration with your new address. If you moved within the same state, you can usually update online. If you moved to a new state, you\'ll need to register in your new state.',
        source: 'vote.gov',
      },
      {
        question: 'Do I need to pick a party when I register?',
        answer: 'It depends on your state. Some states have closed primaries that require party affiliation to participate. In open primary states, you can vote in either party\'s primary regardless of registration.',
      },
      {
        question: 'Can I register if I have a criminal record?',
        answer: 'Voting rights restoration varies by state. Many states restore voting rights after completing a sentence, and some allow voting while on probation or parole. A few states, like Maine and Vermont, never restrict voting rights.',
      },
    ],
    didYouKnow: [
      'North Dakota is the only U.S. state that does not require voter registration.',
      'The National Voter Registration Act of 1993 (Motor Voter Act) requires states to offer voter registration at DMVs.',
      'As of 2024, 22 states plus D.C. offer same-day voter registration.',
    ],
  },
  {
    id: 'primary-elections',
    order: 2,
    title: 'Primary Elections',
    slug: 'primary-elections',
    summary: 'Where parties choose their candidates. Understand open vs. closed primaries, caucuses, and how delegates are allocated.',
    icon: '🗳️',
    details: [
      {
        heading: 'What Are Primaries?',
        content: 'Primary elections are intra-party contests where registered voters help select their party\'s candidates for the general election. They occur at all levels — from presidential to local races.',
      },
      {
        heading: 'Open vs. Closed Primaries',
        content: 'In closed primaries, only registered party members can vote. In open primaries, any registered voter can participate in either party\'s primary (but not both). Semi-open and semi-closed systems create additional variations.',
      },
      {
        heading: 'Caucuses vs. Primaries',
        content: 'Caucuses are local gatherings where party members discuss and vote for candidates, often through multiple rounds. They require more time commitment than primaries, where voters cast a secret ballot. Most states have moved toward primaries for accessibility.',
      },
      {
        heading: 'Delegate Allocation',
        content: 'Presidential primary winners earn delegates who attend the national convention. Democrats allocate delegates proportionally, while Republicans use a mix of winner-take-all and proportional systems depending on the state.',
      },
    ],
    faqs: [
      {
        question: 'When do primaries happen?',
        answer: 'Primary elections are held on different dates in each state, typically between February and June of a presidential election year. Iowa and New Hampshire traditionally hold the first contests.',
      },
      {
        question: 'What is Super Tuesday?',
        answer: 'Super Tuesday is the day when the largest number of states hold their primaries simultaneously, usually in early March. It\'s often a decisive moment in the nomination race.',
      },
      {
        question: 'Can I vote in both party primaries?',
        answer: 'No. Even in open primary states, you can only participate in one party\'s primary per election cycle. Voting in both would be a violation of election law.',
      },
    ],
    didYouKnow: [
      'The first U.S. presidential primary was held in Florida in 1901.',
      'Wisconsin was the first state to adopt a statewide primary law in 1903.',
      'In 2020, the COVID-19 pandemic caused 19 states to postpone their primaries.',
    ],
  },
  {
    id: 'candidate-nomination',
    order: 3,
    title: 'Candidate Nomination',
    slug: 'candidate-nomination',
    summary: 'From conventions to debates — how candidates become official nominees and qualify for the ballot.',
    icon: '🎤',
    details: [
      {
        heading: 'National Conventions',
        content: 'Each major party holds a national convention, usually in July or August, where delegates formally nominate their presidential candidate. The nominee selects a running mate, and the party adopts its official platform.',
      },
      {
        heading: 'Ballot Qualification',
        content: 'Candidates must meet specific requirements to appear on the ballot — such as collecting a minimum number of signatures, paying filing fees, or both. Requirements vary significantly by state and office level.',
      },
      {
        heading: 'Third-Party & Independent Candidates',
        content: 'Third-party and independent candidates face higher barriers to ballot access. They often need many more signatures than major party candidates and may not qualify for debate participation or matching funds.',
      },
      {
        heading: 'Debates',
        content: 'Presidential debates are organized by the Commission on Presidential Debates (or through direct negotiations between campaigns). Candidates typically must meet polling and fundraising thresholds to be invited.',
      },
    ],
    faqs: [
      {
        question: 'What is a brokered convention?',
        answer: 'A brokered convention occurs when no candidate secures a majority of delegates in the first round of voting. Additional rounds of voting take place, and delegates may switch their support until a nominee emerges.',
      },
      {
        question: 'How is the VP pick chosen?',
        answer: 'The presidential nominee typically selects their running mate based on factors like geographic balance, ideological complement, and electoral strategy. The convention formally ratifies the choice.',
      },
    ],
    didYouKnow: [
      'The first televised presidential debate was between Kennedy and Nixon in 1960.',
      'In a brokered convention scenario, "superdelegates" can play a decisive role in the Democratic Party.',
      'Abraham Lincoln was nominated on the third ballot at the 1860 Republican convention.',
    ],
  },
  {
    id: 'campaign-period',
    order: 4,
    title: 'Campaign Period',
    slug: 'campaign-period',
    summary: 'The intense period of rallies, ads, and debates. Learn about campaign finance, media, and voter outreach.',
    icon: '📢',
    details: [
      {
        heading: 'Campaign Finance',
        content: 'Federal campaigns are regulated by the Federal Election Commission (FEC). Individual contribution limits, PAC contributions, and Super PAC spending are all governed by campaign finance law. Dark money groups also play a significant role.',
      },
      {
        heading: 'Media & Advertising',
        content: 'Campaigns invest heavily in TV ads, digital marketing, and social media outreach. The "equal time rule" requires broadcast stations to provide equal airtime opportunities to qualified candidates, though news coverage is exempt.',
      },
      {
        heading: 'Rallies & Ground Game',
        content: 'Campaign events, town halls, and door-to-door canvassing remain critical for voter engagement. The "ground game" — volunteer networks, phone banks, and field offices — often makes the difference in close races.',
      },
      {
        heading: 'Polls & Predictions',
        content: 'Polling data helps campaigns allocate resources and shape messaging. Aggregators combine multiple polls for more accurate predictions, though margins of error mean election outcomes can still surprise.',
      },
    ],
    faqs: [
      {
        question: 'What is a Super PAC?',
        answer: 'A Super PAC (Political Action Committee) can raise unlimited funds from individuals, corporations, and unions to spend on independent expenditures supporting or opposing candidates. They cannot coordinate directly with campaigns.',
      },
      {
        question: 'How much can I donate to a candidate?',
        answer: 'For the 2024 cycle, individuals can contribute up to $3,300 per election (primary and general are separate) to a candidate. Contribution limits are adjusted for inflation every two years.',
      },
    ],
    didYouKnow: [
      'The 2020 presidential election cycle cost approximately $14 billion, making it the most expensive in U.S. history.',
      'Dwight Eisenhower ran the first TV campaign ads in 1952.',
      'Swing states often receive over 90% of campaign visits and advertising spending.',
    ],
  },
  {
    id: 'election-day',
    order: 5,
    title: 'Election Day',
    slug: 'election-day',
    summary: 'The big day! Understand voting methods, polling locations, ID requirements, and your rights as a voter.',
    icon: '🏛️',
    details: [
      {
        heading: 'Voting Methods',
        content: 'Americans can vote in person on Election Day, through early voting (available in most states), or via absentee/mail-in ballots. Each method has different deadlines and requirements depending on your state.',
      },
      {
        heading: 'Polling Locations',
        content: 'Your polling place is determined by your registered address. You can find your assigned location through your state\'s election website or vote.gov. Polls are typically open from early morning to evening.',
      },
      {
        heading: 'Voter ID Requirements',
        content: 'ID requirements vary widely by state. Some states require photo ID, others accept non-photo ID, and some have no ID requirement. If you lack the required ID, most states offer provisional ballot options.',
      },
      {
        heading: 'Your Voting Rights',
        content: 'You have the right to vote free from intimidation, to receive assistance if you have a disability, to cast a provisional ballot if your eligibility is questioned, and to report problems to election officials.',
      },
    ],
    faqs: [
      {
        question: 'What if I make a mistake on my ballot?',
        answer: 'If you\'re voting in person, you can request a new ballot (a "spoiled ballot") before submitting. For mail-in ballots, contact your local election office for guidance on corrections.',
      },
      {
        question: 'Can my employer prevent me from voting?',
        answer: 'Most states have laws requiring employers to provide time off for voting. Some states require paid time off. Check your state\'s specific laws for details.',
      },
      {
        question: 'What is a provisional ballot?',
        answer: 'A provisional ballot is a fail-safe for voters whose eligibility is in question on Election Day. Your ballot is set aside and counted only after election officials verify your eligibility.',
      },
    ],
    didYouKnow: [
      'Election Day was set as the first Tuesday after the first Monday in November by Congress in 1845.',
      'Oregon was the first state to conduct all elections entirely by mail, starting in 2000.',
      'Over 159 million people voted in the 2020 presidential election — the highest turnout in 120 years.',
    ],
  },
  {
    id: 'results-certification',
    order: 6,
    title: 'Results & Certification',
    slug: 'results-certification',
    summary: 'From counting to certification — how votes become official results and the Electoral College makes the final call.',
    icon: '✅',
    details: [
      {
        heading: 'Vote Counting',
        content: 'After polls close, election workers begin tabulating results. Some states count mail-in ballots before Election Day (pre-canvassing), while others start counting on Election Day itself, which can delay final results.',
      },
      {
        heading: 'Audits & Recounts',
        content: 'Many states conduct post-election audits to verify accuracy. Automatic recounts are triggered when the margin of victory falls below a set threshold (typically 0.5%). Candidates can also request recounts in most states.',
      },
      {
        heading: 'Electoral College',
        content: 'In presidential elections, citizens technically vote for "electors" who then cast electoral votes. A candidate needs 270 of 538 electoral votes to win. Most states use winner-take-all allocation, with Maine and Nebraska as exceptions.',
      },
      {
        heading: 'Certification & Inauguration',
        content: 'States certify their results by their respective deadlines. Congress counts electoral votes on January 6th. The presidential inauguration takes place on January 20th, when the new president takes the oath of office.',
      },
    ],
    faqs: [
      {
        question: 'Why does it take days to count all votes?',
        answer: 'The volume of mail-in/absentee ballots, varying state laws on when counting can begin, verification requirements, and the sheer number of ballots all contribute to the time needed for complete counts.',
      },
      {
        question: 'What happens if the Electoral College ties?',
        answer: 'In a 269-269 tie, the House of Representatives elects the President (each state delegation gets one vote), and the Senate elects the Vice President. This process is defined in the 12th Amendment.',
      },
      {
        question: 'Can a state change its electoral votes after voting?',
        answer: 'While "faithless electors" have voted against their pledge in the past, the Supreme Court ruled in 2020 (Chiafalo v. Washington) that states can enforce laws binding electors to the popular vote winner.',
      },
    ],
    didYouKnow: [
      'The Electoral College has produced five presidents who lost the popular vote, most recently in 2016.',
      'Only two presidential elections have been decided by the House of Representatives — 1800 and 1824.',
      'The 20th Amendment moved Inauguration Day from March 4th to January 20th, starting in 1937.',
    ],
  },
];
