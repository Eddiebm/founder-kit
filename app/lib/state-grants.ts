export interface StateGrant {
  name: string;
  agency: string;
  amount: string;
  description: string;
  url: string;
}

export interface StateGrantInfo {
  programs: StateGrant[];
  sbdcUrl: string;
}

export const FEDERAL_PROGRAMS: StateGrant[] = [
  {
    name: "SBIR / STTR",
    agency: "Multiple federal agencies (NIH, NSF, DOD, DOE, NASA)",
    amount: "Phase I: up to $300K · Phase II: up to $2M",
    description: "Non-dilutive R&D funding for small businesses with a technology or research component. Available in all 50 states.",
    url: "https://www.sbir.gov/",
  },
  {
    name: "SBA 7(a) Loan Program",
    agency: "U.S. Small Business Administration",
    amount: "Up to $5M",
    description: "Low-interest loans for working capital, equipment, and real estate — the most accessible federal financing program.",
    url: "https://www.sba.gov/funding-programs/loans/7a-loans",
  },
  {
    name: "Economic Development Administration (EDA) Grants",
    agency: "U.S. Department of Commerce",
    amount: "$100K–$10M+",
    description: "Competitive grants for economic development projects in manufacturing, innovation, and tech.",
    url: "https://www.eda.gov/funding/programs",
  },
  {
    name: "USDA Rural Development Business Grants",
    agency: "U.S. Department of Agriculture",
    amount: "Up to $500K",
    description: "Grants and loans for businesses in rural areas driving economic development and job creation.",
    url: "https://www.rd.usda.gov/programs-services/business-programs",
  },
];

const STATE_PROGRAMS: Partial<Record<string, StateGrant[]>> = {
  CA: [
    {
      name: "California Competes Tax Credit",
      agency: "Governor's Office of Business and Economic Development (GO-Biz)",
      amount: "Negotiated",
      description: "Income tax credits for businesses that create jobs in California, awarded in competitive application rounds.",
      url: "https://business.ca.gov/california-competes-tax-credit/",
    },
    {
      name: "IBank Small Business Finance Center",
      agency: "California Infrastructure and Economic Development Bank",
      amount: "Up to $500K",
      description: "Loans and loan guarantees for small businesses in low-wealth communities.",
      url: "https://ibank.ca.gov/small-business/",
    },
    {
      name: "CALOSBA Small Business Loan Guarantee",
      agency: "California Office of the Small Business Advocate",
      amount: "Up to $2.5M",
      description: "State-backed guarantees that help small businesses access capital they wouldn't otherwise qualify for.",
      url: "https://calosba.ca.gov/",
    },
  ],
  TX: [
    {
      name: "Texas Enterprise Fund",
      agency: "Office of the Governor",
      amount: "Negotiated ($500K–$5M+)",
      description: "Closing fund for businesses creating significant jobs in Texas. Requires a competing out-of-state offer.",
      url: "https://gov.texas.gov/business/page/texas-enterprise-fund",
    },
    {
      name: "Texas Small Business Credit Initiative (SSBCI)",
      agency: "Texas Treasury Safekeeping Trust Company",
      amount: "Varies",
      description: "Capital access programs and loan guarantees for Texas small businesses through federal SSBCI 2.0 funding.",
      url: "https://comptroller.texas.gov/economy/local/ssbci/",
    },
    {
      name: "Texas Leverage Fund",
      agency: "Texas Economic Development Bank",
      amount: "Up to $1M",
      description: "Gap financing for small businesses in economically distressed Texas communities.",
      url: "https://gov.texas.gov/business/page/financing-assistance",
    },
  ],
  NY: [
    {
      name: "Excelsior Jobs Program",
      agency: "Empire State Development",
      amount: "Refundable tax credits over 10 years",
      description: "Tax credits for businesses that create or retain jobs in strategic industries — technology, biotech, and clean energy.",
      url: "https://esd.ny.gov/excelsior-jobs-program",
    },
    {
      name: "NY Ventures Fund",
      agency: "Empire State Development",
      amount: "$150K–$500K",
      description: "Seed investment for early-stage technology companies based in New York.",
      url: "https://esd.ny.gov/ny-ventures",
    },
    {
      name: "Innovate NY Fund",
      agency: "Empire State Development",
      amount: "Up to $500K",
      description: "Grants for high-growth startups in digital technology, life sciences, and clean energy.",
      url: "https://esd.ny.gov/nystar-programs",
    },
  ],
  FL: [
    {
      name: "Florida SBIR/STTR Matching Grant",
      agency: "Florida Department of Commerce",
      amount: "Up to $50K (matching)",
      description: "Florida matches a portion of your federal SBIR/STTR Phase I award to extend your R&D runway.",
      url: "https://www.floridajobs.org/business-growth-and-partnerships/for-employers-and-businesses/business-development/small-business-innovative-research",
    },
    {
      name: "Florida Job Growth Grant Fund",
      agency: "Florida Department of Commerce",
      amount: "Varies",
      description: "Grants for workforce training and public infrastructure investments that support business expansion.",
      url: "https://www.floridajobs.org/business-growth-and-partnerships/for-employers-and-businesses/florida-job-growth-grant-fund",
    },
  ],
  WA: [
    {
      name: "Washington State Innovation Grants",
      agency: "WA Department of Commerce",
      amount: "Varies",
      description: "Economic development grants across clean energy, manufacturing, and rural development sectors.",
      url: "https://www.commerce.wa.gov/",
    },
    {
      name: "Innovation Partnership Zones (IPZ)",
      agency: "Washington State",
      amount: "Varies by zone",
      description: "Tax incentives and co-investment for tech and life science startups in designated WA zones.",
      url: "https://www.commerce.wa.gov/growing-the-economy/innovation/innovation-partnership-zones/",
    },
  ],
  CO: [
    {
      name: "Advanced Industries Accelerator Grants",
      agency: "Colorado Office of Economic Development (OEDIT)",
      amount: "Proof of Concept: up to $150K · Early Stage: up to $250K",
      description: "Grants for Colorado tech companies in aerospace, bioscience, clean energy, electronics, IT, and infrastructure.",
      url: "https://oedit.colorado.gov/advanced-industries-accelerator-grants",
    },
    {
      name: "Colorado FIRST Training Grant",
      agency: "Colorado Office of Economic Development",
      amount: "Up to $130K",
      description: "Reimbursement grants for training new and existing employees at Colorado companies.",
      url: "https://oedit.colorado.gov/colorado-first-customized-training",
    },
  ],
  MA: [
    {
      name: "MassTech SBIR/STTR Matching Grant",
      agency: "Massachusetts Technology Collaborative",
      amount: "Up to $250K (matching)",
      description: "Massachusetts matches a portion of your federal SBIR/STTR Phase I award to extend your commercialization runway.",
      url: "https://masstech.org/innovation-services/sbir-sttr-matching-grant",
    },
    {
      name: "Massachusetts Small Business Technical Assistance",
      agency: "Massachusetts Growth Capital Corporation",
      amount: "Varies",
      description: "Technical assistance grants and loans for small businesses that lack access to capital.",
      url: "https://www.massfinance.com/",
    },
  ],
  GA: [
    {
      name: "OneGeorgia Authority EDGE Fund",
      agency: "OneGeorgia Authority",
      amount: "Up to $500K",
      description: "Economic development grants for businesses creating jobs in rural and distressed Georgia communities.",
      url: "https://www.dca.ga.gov/economic-development/economic-development-programs/onegeorgia-authority",
    },
    {
      name: "Georgia ATDC SBIR Support",
      agency: "Advanced Technology Development Center (ATDC)",
      amount: "Assistance + matching resources",
      description: "Georgia's ATDC helps startups apply for federal SBIR/STTR funding and connects them with matching resources.",
      url: "https://atdc.org/",
    },
  ],
  IL: [
    {
      name: "Illinois Business Attraction Grants",
      agency: "Illinois Department of Commerce and Economic Opportunity",
      amount: "Varies",
      description: "Competitive grants for businesses relocating to or expanding in Illinois.",
      url: "https://dceo.illinois.gov/",
    },
    {
      name: "River Edge Redevelopment Zone Tax Credit",
      agency: "Illinois DCEO",
      amount: "25% of eligible investment",
      description: "Tax credits for businesses rehabilitating or building in designated Illinois River Edge zones.",
      url: "https://dceo.illinois.gov/",
    },
  ],
  NC: [
    {
      name: "NC IDEA SEED Grant",
      agency: "NC IDEA Foundation",
      amount: "$50K",
      description: "Competitive grants for early-stage NC startups building a minimum viable product and validating customers.",
      url: "https://ncidea.org/grants/seed/",
    },
    {
      name: "Job Development Investment Grant (JDIG)",
      agency: "NC Department of Commerce",
      amount: "Up to 75% of state income taxes withheld",
      description: "Performance-based grants for new and expanding businesses creating jobs in North Carolina.",
      url: "https://www.nccommerce.com/business-industries-and-energy/incentive-programs/incentives/job-development-investment-grant-jdig",
    },
  ],
  VA: [
    {
      name: "Virginia SBIR/STTR Matching Funds",
      agency: "Center for Innovative Technology (CIT)",
      amount: "Up to $100K (matching)",
      description: "Virginia matches a portion of your federal SBIR/STTR Phase I award to help commercialize your technology.",
      url: "https://www.cit.org/",
    },
    {
      name: "GO Virginia Economic Development Grants",
      agency: "GO Virginia / DHCD",
      amount: "Varies",
      description: "Regional grants to grow and diversify Virginia's economy through business creation and job growth.",
      url: "https://dhcd.virginia.gov/go-virginia",
    },
  ],
  AZ: [
    {
      name: "Arizona Innovation Challenge",
      agency: "Arizona Commerce Authority",
      amount: "Up to $150K",
      description: "Competitive grants for high-growth Arizona startups in technology, life sciences, and clean energy.",
      url: "https://www.azcommerce.com/programs/innovation-challenge/",
    },
  ],
  PA: [
    {
      name: "Ben Franklin Technology Partners",
      agency: "Pennsylvania DCED",
      amount: "Up to $100K",
      description: "Seed funding and technical assistance for Pennsylvania technology startups and manufacturers.",
      url: "https://www.benfranklin.org/",
    },
    {
      name: "Commonwealth Financing Authority Grants",
      agency: "Pennsylvania CFA",
      amount: "Varies",
      description: "Economic development grants and loans for Pennsylvania small businesses.",
      url: "https://dced.pa.gov/programs/cfa/",
    },
  ],
  OH: [
    {
      name: "Ohio Third Frontier",
      agency: "Ohio Department of Development",
      amount: "Up to $2M",
      description: "Competitive grants for Ohio technology companies commercializing products and creating high-paying jobs.",
      url: "https://development.ohio.gov/business/ohio-third-frontier",
    },
    {
      name: "Ohio SSBCI Capital Programs",
      agency: "Ohio Department of Development",
      amount: "Varies",
      description: "Capital access programs and loan guarantees for Ohio small businesses through SSBCI 2.0 funding.",
      url: "https://development.ohio.gov/business/small-business-development-centers",
    },
  ],
  MI: [
    {
      name: "Michigan Business Development Program",
      agency: "Michigan Economic Development Corporation",
      amount: "Varies",
      description: "Performance-based grants for businesses creating new jobs or making capital investments in Michigan.",
      url: "https://www.michiganbusiness.org/",
    },
    {
      name: "Pure Michigan Business Connect",
      agency: "MEDC",
      amount: "Varies",
      description: "Programs connecting Michigan businesses with capital, contracts, and resources to grow in-state.",
      url: "https://www.michiganbusiness.org/pm/business-connect/",
    },
  ],
  TN: [
    {
      name: "FastTrack Economic Development Fund",
      agency: "Tennessee Department of Economic and Community Development",
      amount: "Varies",
      description: "Job creation and capital investment grants for businesses expanding or relocating to Tennessee.",
      url: "https://www.tnecd.com/incentives/",
    },
  ],
  MN: [
    {
      name: "Minnesota Job Creation Fund",
      agency: "DEED (MN Employment and Economic Development)",
      amount: "Up to $1M",
      description: "Performance-based grants for businesses creating jobs and making capital investments in Minnesota.",
      url: "https://mn.gov/deed/business/financing-business/deed-programs/jcf/",
    },
    {
      name: "Small Business Development Loan Program",
      agency: "DEED",
      amount: "Up to $150K",
      description: "Low-interest loans for Minnesota small businesses that need working capital or equipment.",
      url: "https://mn.gov/deed/business/financing-business/deed-programs/sblp/",
    },
  ],
  OR: [
    {
      name: "Business Oregon Rural Opportunity Initiative",
      agency: "Business Oregon",
      amount: "Varies",
      description: "Grants and incentives for businesses creating jobs in rural Oregon communities.",
      url: "https://businessoregon.com/",
    },
  ],
  WI: [
    {
      name: "Wisconsin Economic Development Corporation (WEDC) Grants",
      agency: "WEDC",
      amount: "Varies",
      description: "Competitive grants for Wisconsin businesses creating jobs and making capital investments.",
      url: "https://wedc.org/programs-and-resources/",
    },
  ],
  NV: [
    {
      name: "Nevada Governor's Office of Economic Development Grants",
      agency: "GOED",
      amount: "Varies",
      description: "Business incentives, abatements, and grants for companies creating jobs in Nevada's diversified economy.",
      url: "https://goed.nv.gov/incentives/",
    },
  ],
  IN: [
    {
      name: "IEDC Regional Economic Acceleration & Development Initiative",
      agency: "Indiana Economic Development Corporation",
      amount: "Varies",
      description: "Grants for Indiana businesses and communities driving regional economic growth.",
      url: "https://www.iedc.in.gov/programs/small-business",
    },
  ],
  MO: [
    {
      name: "Missouri Works",
      agency: "Missouri Department of Economic Development",
      amount: "Tax withholding benefits",
      description: "Incentive program that lets Missouri businesses retain a portion of state withholding taxes for job creation.",
      url: "https://ded.mo.gov/content/missouri-works",
    },
  ],
  MD: [
    {
      name: "Maryland TEDCO Technology Commercialization Fund",
      agency: "TEDCO",
      amount: "Up to $50K",
      description: "Pre-seed funding for Maryland innovators commercializing technology developed at a Maryland research institution.",
      url: "https://www.tedcomd.com/funding/tcf",
    },
    {
      name: "Maryland EARN Maryland Workforce Grants",
      agency: "Maryland Department of Labor",
      amount: "Up to $1M",
      description: "Sector-based workforce training grants for Maryland businesses partnering with community colleges.",
      url: "https://earn.maryland.gov/",
    },
  ],
  CT: [
    {
      name: "Connecticut Innovations Seed Fund",
      agency: "Connecticut Innovations",
      amount: "$100K–$500K",
      description: "Seed investment for Connecticut technology and life science startups.",
      url: "https://ctinnovations.com/",
    },
  ],
  UT: [
    {
      name: "Utah Governor's Office of Economic Opportunity Grants",
      agency: "Utah GOEO",
      amount: "Varies",
      description: "Business grants and incentives for companies creating jobs and diversifying Utah's economy.",
      url: "https://business.utah.gov/incentives/",
    },
  ],
  KY: [
    {
      name: "Kentucky Business Investment Program",
      agency: "Kentucky Cabinet for Economic Development",
      amount: "Varies",
      description: "Tax incentives and grants for new and expanding Kentucky businesses creating quality jobs.",
      url: "https://ced.ky.gov/Business/Incentives",
    },
  ],
  AL: [
    {
      name: "Alabama Jobs Act Incentives",
      agency: "Alabama Department of Commerce",
      amount: "Tax credits up to $1,500/job",
      description: "Incentives for Alabama businesses adding full-time jobs and making qualifying capital investments.",
      url: "https://www.madeinalabama.com/locate/incentives/",
    },
  ],
  SC: [
    {
      name: "South Carolina Jobs Tax Credit",
      agency: "SC Department of Commerce",
      amount: "$1,500–$8,000 per new job",
      description: "Annual tax credits for South Carolina businesses creating new full-time jobs in eligible industries.",
      url: "https://sccommerce.com/doing-business/incentives",
    },
  ],
  LA: [
    {
      name: "Louisiana Angel Investor Tax Credit",
      agency: "Louisiana Economic Development",
      amount: "25% tax credit on qualified investment",
      description: "Louisiana offers a 25% tax credit to investors backing qualified early-stage Louisiana businesses.",
      url: "https://www.opportunitylouisiana.gov/business-incentives/angel-investor-tax-credit",
    },
  ],
  OK: [
    {
      name: "Oklahoma Quality Jobs Program",
      agency: "Oklahoma Department of Commerce",
      amount: "Up to 5% of new payroll for 10 years",
      description: "Cash incentive for Oklahoma businesses creating high-paying jobs above the county average wage.",
      url: "https://www.okcommerce.gov/incentives/quality-jobs/",
    },
  ],
  KS: [
    {
      name: "Kansas PEAK (Promoting Employment Across Kansas)",
      agency: "Kansas Department of Commerce",
      amount: "Up to 95% of payroll withholding taxes for 10 years",
      description: "Significant payroll tax retention incentive for businesses creating quality jobs in Kansas.",
      url: "https://www.kansascommerce.gov/programs/incentives/peak/",
    },
  ],
  NE: [
    {
      name: "Nebraska ImagiNE Act",
      agency: "Nebraska Department of Economic Development",
      amount: "Varies",
      description: "Tax incentives for Nebraska businesses making qualifying investments and creating jobs.",
      url: "https://opportunity.nebraska.gov/programs/imagine-nebraska-act/",
    },
  ],
  IA: [
    {
      name: "Iowa High Quality Jobs Program",
      agency: "Iowa Economic Development Authority",
      amount: "Tax credits + refunds",
      description: "Incentives for Iowa businesses creating high-paying jobs above the county average wage.",
      url: "https://www.iowaeda.com/high-quality-jobs/",
    },
  ],
  AR: [
    {
      name: "Arkansas Advantage Program",
      agency: "Arkansas Economic Development Commission",
      amount: "Varies",
      description: "Job creation incentives for Arkansas businesses creating new payroll and making capital investments.",
      url: "https://www.arkansasedc.com/locate/incentives/",
    },
  ],
  MS: [
    {
      name: "Mississippi Advantage Jobs Incentive Program",
      agency: "Mississippi Development Authority",
      amount: "Up to 4% of payroll for 10 years",
      description: "Cash rebate for companies creating at least 10 new jobs at or above average county wages.",
      url: "https://mississippi.org/incentives/",
    },
  ],
  NM: [
    {
      name: "New Mexico Job Training Incentive Program",
      agency: "New Mexico Economic Development Department",
      amount: "Up to $3,500 per trainee",
      description: "Grants to reimburse businesses for the cost of training new full-time employees.",
      url: "https://gonm.biz/business-development/incentives/",
    },
  ],
  WV: [
    {
      name: "West Virginia Business Investment and Jobs Expansion Tax Credit",
      agency: "WV Development Office",
      amount: "Tax credits per new job",
      description: "Tax credits for WV businesses making capital investments and creating new full-time jobs.",
      url: "https://business.wv.gov/incentives/Pages/default.aspx",
    },
  ],
  ME: [
    {
      name: "Maine Venture Fund",
      agency: "Maine Technology Institute",
      amount: "Seed: up to $100K",
      description: "Seed investment for Maine technology companies at the commercialization stage.",
      url: "https://www.mainetechnology.org/",
    },
  ],
  NH: [
    {
      name: "NH Business Finance Authority Loan Guarantees",
      agency: "NH Business Finance Authority",
      amount: "Varies",
      description: "Loan guarantees and bond financing to help NH businesses access capital for growth and expansion.",
      url: "https://www.nhbfa.com/",
    },
  ],
  RI: [
    {
      name: "RI Commerce Corp. Small Business Assistance",
      agency: "Rhode Island Commerce Corporation",
      amount: "Varies",
      description: "Grants, loans, and incentives for small businesses growing and creating jobs in Rhode Island.",
      url: "https://commerceri.com/programs/",
    },
  ],
  VT: [
    {
      name: "Vermont Economic Development Authority (VEDA)",
      agency: "VEDA",
      amount: "Varies",
      description: "Loans and financing programs for Vermont small businesses that need capital to grow.",
      url: "https://www.veda.org/",
    },
  ],
  MT: [
    {
      name: "Montana Research and Commercialization Tax Credit",
      agency: "Montana Department of Revenue",
      amount: "Up to $15K per year",
      description: "Tax credits for Montana investors backing qualifying seed-stage businesses.",
      url: "https://mymtbusiness.com/",
    },
  ],
  ID: [
    {
      name: "Idaho Opportunity Fund",
      agency: "Idaho Department of Commerce",
      amount: "Varies",
      description: "Grants for economic development projects that create jobs in rural and underserved Idaho communities.",
      url: "https://commerce.idaho.gov/business/",
    },
  ],
  WY: [
    {
      name: "Wyoming Business Council Grants",
      agency: "Wyoming Business Council",
      amount: "Varies",
      description: "Business development and community development grants for Wyoming businesses and communities.",
      url: "https://wyomingbusiness.org/programs-resources/",
    },
  ],
  AK: [
    {
      name: "Alaska Industrial Development and Export Authority (AIDEA)",
      agency: "AIDEA",
      amount: "Varies",
      description: "Loans and loan participation for Alaska businesses in a wide range of industries.",
      url: "https://www.aidea.org/",
    },
  ],
  HI: [
    {
      name: "Hawaii Technology Development Corporation (HTDC)",
      agency: "HTDC",
      amount: "Grants + lab space",
      description: "Grants and facility access for Hawaii tech startups, especially in defense, energy, and biotech.",
      url: "https://htdc.org/",
    },
  ],
  ND: [
    {
      name: "North Dakota Development Fund",
      agency: "ND Department of Commerce",
      amount: "Varies",
      description: "Loans and grants for businesses creating jobs in North Dakota's growing economy.",
      url: "https://www.commerce.nd.gov/",
    },
  ],
  SD: [
    {
      name: "South Dakota REDI Fund",
      agency: "SD Governor's Office of Economic Development",
      amount: "Varies",
      description: "Low-interest loans and grants for South Dakota businesses expanding operations and creating jobs.",
      url: "https://sdreadytowork.com/",
    },
  ],
  DC: [
    {
      name: "DC Department of Small and Local Business Development",
      agency: "DSLBD",
      amount: "Varies",
      description: "Grants, loans, and certifications for DC-based small businesses and entrepreneurs.",
      url: "https://dslbd.dc.gov/",
    },
  ],
};

const SBDC_URLS: Partial<Record<string, string>> = {
  AL: "https://www.asbdc.org/",
  AK: "https://www.aksbdc.org/",
  AZ: "https://www.azsbdc.net/",
  AR: "https://www.asbtdc.org/",
  CA: "https://www.californiasbdc.org/",
  CO: "https://www.coloradosbdc.org/",
  CT: "https://www.ctsbdc.com/",
  DE: "https://www.delawaresbdc.org/",
  FL: "https://floridasbdc.org/",
  GA: "https://www.georgiasbdc.org/",
  HI: "https://www.hisbdc.org/",
  ID: "https://idahosbdc.org/",
  IL: "https://www.ilsbdc.biz/",
  IN: "https://isbdc.org/",
  IA: "https://www.iowasbdc.org/",
  KS: "https://www.kansassbdc.net/",
  KY: "https://www.ksbdc.org/",
  LA: "https://www.lsbdc.org/",
  ME: "https://www.mainesbdc.org/",
  MD: "https://mdsbdc.umd.edu/",
  MA: "https://www.msbdc.org/",
  MI: "https://sbdcmichigan.org/",
  MN: "https://www.mnsbdc.com/",
  MS: "https://www.msbdc.org/",
  MO: "https://missouristate.edu/sbdc/",
  MT: "https://www.sbdc.mt.gov/",
  NE: "https://nbdc.unl.edu/",
  NV: "https://www.nevadaaudc.com/sbdc",
  NH: "https://www.nhsbdc.org/",
  NJ: "https://njsbdc.com/",
  NM: "https://www.nmsbdc.org/",
  NY: "https://www.nyssbdc.org/",
  NC: "https://www.sbtdc.org/",
  ND: "https://www.ndsbdc.org/",
  OH: "https://www.ohiosbdc.org/",
  OK: "https://www.oksbdc.org/",
  OR: "https://bizcenter.org/",
  PA: "https://pasbdc.org/",
  RI: "https://www.risbdc.org/",
  SC: "https://scsbdc.com/",
  SD: "https://www.sdsbdc.org/",
  TN: "https://www.tsbdc.org/",
  TX: "https://www.txsbdc.org/",
  UT: "https://slcc.edu/sbdc/",
  VT: "https://www.vtsbdc.org/",
  VA: "https://www.virginiasbdc.org/",
  WA: "https://wsbdc.org/",
  WV: "https://www.sbdcwv.org/",
  WI: "https://www.wisconsinsbdc.org/",
  WY: "https://www.wyomingsbdc.org/",
  DC: "https://dcsbdc.com/",
};

const DEFAULT_SBDC = "https://americassbdc.org/small-business-assistance/find-your-sbdc/";

export function getStateGrantInfo(abbr: string): StateGrantInfo {
  return {
    programs: STATE_PROGRAMS[abbr] ?? [],
    sbdcUrl: SBDC_URLS[abbr] ?? DEFAULT_SBDC,
  };
}
