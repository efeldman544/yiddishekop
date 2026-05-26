import { createClient } from '@supabase/supabase-js'

const CANDIDATES = [
  {
    "full_name": "Blimi Brevda",
    "email": "blimib123@gmail.com",
    "phone": "+972 52-763-8345",
    "whatsapp": "+972 54-841-7271",
    "location": "Beitar Illit",
    "current_job_title": "Website manager",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Tech/Software",
      "Healthcare"
    ],
    "tools_software": "claude, private softwares. can learn any software very quickly",
    "languages": "English, Hebrew, Yiddish",
    "roles_seeking": "Beta testing, Secretarial",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8b9e2f_c160f50c4d044e9285fdd5660abe60aa.pdf"
  },
  {
    "full_name": "ADAM SKLAAR",
    "email": "adamiansklaar@gmail.com",
    "phone": "+27 76 124 9671",
    "whatsapp": "+27 76 124 9671",
    "location": "Johannesburg",
    "current_job_title": "Accountant",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Other"
    ],
    "tools_software": "Quickbooks, Xero, Sage and Appfolio",
    "languages": "English",
    "roles_seeking": "Accountant, Bookkeeping and CFO",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1b0f4b_2a2e476922c845c7ae5ae1367fb94ba1.docx"
  },
  {
    "full_name": "Deena sherman",
    "email": "deena5402@icloud.com",
    "phone": "+1 612-306-0917",
    "whatsapp": "+1 612-306-0917",
    "location": "Isreal",
    "current_job_title": "Bookkeeper",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Quickbooks",
    "languages": "English",
    "roles_seeking": "Bookkeeper or any computer or communication work. I can work American hours",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/50a9d4_25af7a3249224e4ba188c19c1f8c38ba~mv2.jpeg"
  },
  {
    "full_name": "Aron gelb",
    "email": "arongelb18@gmail.com",
    "phone": "+972 53-728-3668",
    "whatsapp": "+972 53-728-3668",
    "location": "Safed  Israel",
    "current_job_title": "Have no job",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "0",
    "languages": "English yiddish a little bit of hebrew",
    "roles_seeking": "Management.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f28a1f_1dfd20b270794611a0bc10098fb0570c.pdf"
  },
  {
    "full_name": "Ricky Ostreicher",
    "email": "rickyost343@gmail.com",
    "phone": "+972 53-794-5430",
    "whatsapp": "+972 50-869-5093",
    "location": "Jerusalem Israel",
    "current_job_title": "Unemployed",
    "education_level": "Associate's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Marketing",
      "Other"
    ],
    "tools_software": "Quickbooks, excel",
    "languages": "English French Yiddish",
    "roles_seeking": "Office job, billing, bookkeeping..",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ee78f4_05c2e7e94fa5464892ca91703305848b.pdf"
  },
  {
    "full_name": "Moshe",
    "email": "safranovitzmoshe5@gmail.com",
    "phone": "+1 718-690-5568",
    "whatsapp": "+1 718-690-5568",
    "location": "Elizabeth",
    "current_job_title": "Bookkeeper",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare"
    ],
    "tools_software": "Quickbooks. Sage100.",
    "languages": "English. Hebrew.",
    "roles_seeking": "Bookkeeper. Controller.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "70000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7bff8e_4666d5fb4b214ba396fc2c1d964f549c.pdf"
  },
  {
    "full_name": "Adam Goldin",
    "email": "goldin.adam@icloud.com",
    "phone": "+27 72 308 6711",
    "whatsapp": "+27 72 308 6711",
    "location": "Johannesburg",
    "current_job_title": "Independent Contractor",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Microsoft Office, Google docs, SageX3, Pastel",
    "languages": "English",
    "roles_seeking": "Hybrid",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ed36ad_958cf3ac819047b991636e5009e7e21b.pdf"
  },
  {
    "full_name": "Gilad Elian",
    "email": "giladelian942@gmail.com",
    "phone": "+1 516-423-2734",
    "whatsapp": "+1 516-423-2734",
    "location": "Great Neck, NY",
    "current_job_title": "Marketing & Design Specialist",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Design",
      "Healthcare",
      "Education",
      "Customer Support"
    ],
    "tools_software": "Canva, Figma, Photoshop, InDesign",
    "languages": "English, Hebrew",
    "roles_seeking": "Graphic design",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9c17dd_44e0a10ed2ba4d86a38171f9a4af0c69.pdf"
  },
  {
    "full_name": "Kevin Brett",
    "email": "akivabrett@gmail.com",
    "phone": "+27 82 346 3669",
    "whatsapp": "+27 82 346 3669",
    "location": "Johannesburg, South Africa",
    "current_job_title": "Accountant",
    "education_level": "Master's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Sage, Excel, Microsoft Office",
    "languages": "English",
    "roles_seeking": "Accounting, Bookkeeping, Admin",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "300/hour",
    "currency": "Rands",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/413419_08207261338049709a61d6e2ebd912e8.docx"
  },
  {
    "full_name": "Shevy",
    "email": "sheva3237@gmail.com",
    "phone": "+1 845-828-0350",
    "whatsapp": "+1 845-828-0350",
    "location": "Airmont",
    "current_job_title": "Accounts receivable & payable",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Design",
      "Tech/Software"
    ],
    "tools_software": "Qb, excell. Acumatica",
    "languages": "English Hebrew and Yiddish.",
    "roles_seeking": "Anything remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "100000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/3feb1a_2bd73b4a9ff247ada5470a99230cd168.docx"
  },
  {
    "full_name": "Leora Rubinstein",
    "email": "leorarubin98@gmail.com",
    "phone": "+1 518-487-9991",
    "whatsapp": "+1 518-487-9991",
    "location": "Flushing NY but looking for florida",
    "current_job_title": "Director of HR",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Healthcare",
      "Other"
    ],
    "tools_software": "Viventium, Micro staffer, Apploi",
    "languages": "English",
    "roles_seeking": "HR, operations",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "100000/year",
    "currency": "American",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/96adc8_d4a7e39643f34be49c0fcfcc6983bfc5.pdf"
  },
  {
    "full_name": "Hindy Herskovitz",
    "email": "hindyherskovitz@gmail.com",
    "phone": "+972 53-322-9428",
    "whatsapp": "+1 845-608-6837",
    "location": "Jerusalem, Israel",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Microsoft word",
    "languages": "English, Yiddish",
    "roles_seeking": "Costumer service, sales representative",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e80867_b5e1152179af48ab8f923cf6881e418c.pdf"
  },
  {
    "full_name": "Shira florans",
    "email": "zebradesignstudio7@gmail.com",
    "phone": "+1 718-223-7927",
    "whatsapp": "+1 929-542-9358",
    "location": "Jerusalem, israel",
    "current_job_title": "Graphic designer. Zebradesignstudios.com",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Design"
    ],
    "tools_software": "Adobe suite",
    "languages": "Englis",
    "roles_seeking": "Freelance branding and ad campaigns",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/648f68_99e037d9465842328aebaf616e09c2a0~mv2.jpeg"
  },
  {
    "full_name": "Yosef krishewsky",
    "email": "yk0537510805@gmail.com",
    "phone": "+1 551-246-0408",
    "whatsapp": "+1 917-384-6762",
    "location": "Jerusalem , Israel",
    "current_job_title": "Graphic designer",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support",
      "Tech/Software"
    ],
    "tools_software": "Adobe , office , and more",
    "languages": "Yiddish English Hebrew",
    "roles_seeking": "Management , assistant , office environment, design , marketing",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/08907b_0386e437535742acbde025bb8c996d57.pdf"
  },
  {
    "full_name": "Doba Raiza Greene",
    "email": "doba.greene@gmail.com",
    "phone": "+1 651-236-0030",
    "whatsapp": "+1 651-236-0030",
    "location": "Saint Paul, MN , USA",
    "current_job_title": "Collections Specialist",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software",
      "Customer Support"
    ],
    "tools_software": "Slack, Google, Quick Books",
    "languages": "English",
    "roles_seeking": "Customer Service, Data Entry",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "90/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/33b11b_2ec584ebe686404f8257e90d811096e3.pdf"
  },
  {
    "full_name": "Samuel Elliot Kronman",
    "email": "sekronman@gmail.com",
    "phone": "+1 713-305-9768",
    "whatsapp": "+972 55-334-0670",
    "location": "Safed",
    "current_job_title": "Tax Accountant",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Office, Google, Drake",
    "languages": "English",
    "roles_seeking": "Tax associate, office manager, book keeper",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "75000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c0549e_5afcdeb9eb8647a58f9ee45a41ed85a3.pdf"
  },
  {
    "full_name": "Hunter ברוך Lukacs",
    "email": "hunterlukacs@gmail.com",
    "phone": "+1 929-400-2060",
    "whatsapp": "+1 929-400-2060",
    "location": "Newark, Delaware, USA",
    "current_job_title": "Accountant",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Ultratax, QuickBooks, Drake, Excel, Python and other coding",
    "languages": "English, Spanish, Hebrew.",
    "roles_seeking": "FT WFH Accounting",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "90000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1754b1_83a6ce5687bb4237920d98f4b02c208d.pdf"
  },
  {
    "full_name": "Riva Weiss",
    "email": "riva.m.weiss@gmail.com",
    "phone": "+1 847-807-9822",
    "whatsapp": "+1 847-807-9822",
    "location": "Lauderhill Florida, United States",
    "current_job_title": "N/A",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "Spreadsheets and excel",
    "languages": "English and half Hebrew",
    "roles_seeking": "Remote administrative positions",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/6bc8db_dbc4646663174264b3dfe91ee9e18028.pdf"
  },
  {
    "full_name": "Hadassah Feder",
    "email": "h48794879@gmail.com",
    "phone": "+972 58-322-4879",
    "whatsapp": "+972 58-322-4879",
    "location": "Jerusalem, Israel",
    "current_job_title": "Accountent, CPA",
    "education_level": "Master's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Teams, Outlook",
    "languages": "English & Hebrew",
    "roles_seeking": "Audit",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "192000/year",
    "currency": "NIS",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/35221a_3c6f69ce2f014750bf799b69bfe93da4.docx"
  },
  {
    "full_name": "Shoshana Scheinberg",
    "email": "shoshspitz@icloud.com",
    "phone": "+972 58-778-1812",
    "whatsapp": "+1 848-245-3869",
    "location": "Ramat Beit shemesh",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other:"
    ],
    "tools_software": "None",
    "languages": "English & Hebrew",
    "roles_seeking": "Flexible",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "22/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/166899_d19bd278c75e47008340a3c5b2be0bf9.pdf"
  },
  {
    "full_name": "Chaya Eka Neuman",
    "email": "akabookkeepingcorp@gmail.com",
    "phone": "+1 929-340-0047",
    "whatsapp": "+1 929-340-0047",
    "location": "Wimauma, FL",
    "current_job_title": "Bookkeeper",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "QuickBooks desktop/ QuickBooks online/ rent manager/office 365/intuit/",
    "languages": "English and Yiddish",
    "roles_seeking": "Bookkeeper/Secretary",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "55/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4e5d6a_35a1d605db6e4c8c8885d71806fca0a6.pdf"
  },
  {
    "full_name": "Frady Horowitz",
    "email": "fradybarzeski@gmail.com",
    "phone": "+1 914-719-3275",
    "whatsapp": "+1 914-719-3275",
    "location": "USA",
    "current_job_title": "None",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "I know a bit of quickbooks",
    "languages": "English, Yiddish",
    "roles_seeking": "Any entry level position",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "28/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/56ad2c_cc08c26cfa0e440b9afeacb50fa0aec8~mv2.jpeg"
  },
  {
    "full_name": "Berry Gestetner",
    "email": "gestetnerberry@gmail.com",
    "phone": "+1 914-849-8663",
    "whatsapp": "+1 845-288-4707",
    "location": "Spring valley",
    "current_job_title": "Director of sales",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Other:",
      "Tech/Software"
    ],
    "tools_software": "A lot of them,",
    "languages": "English & yiddish",
    "roles_seeking": "Management mostly with some sales",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "100000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/afc81a_5e13208889c1417fae8f63cf4c5e1fc9.pdf"
  },
  {
    "full_name": "Jacob Lebovits",
    "email": "yankylebowitz@gmail.com",
    "phone": "+1 347-784-4965",
    "whatsapp": "+1 347-784-4965",
    "location": "Brooklyn",
    "current_job_title": "Apartment broker",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other:"
    ],
    "tools_software": "Na",
    "languages": "Yiddish English",
    "roles_seeking": "Property Managing or something similar",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "85000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5432f9_9169eed57f6f4a0889a212c64dcee5c9.pdf"
  },
  {
    "full_name": "Caroline Bitton",
    "email": "bittoncaroline147@gmail.com",
    "phone": "+1 437-779-7117",
    "whatsapp": "+1 437-779-7117",
    "location": "Toronto",
    "current_job_title": "Assurance Partner",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Design",
      "Education",
      "Other"
    ],
    "tools_software": "Excel, MS365, CCH, CasWare",
    "languages": "English, French and Hebrew",
    "roles_seeking": "Auditing, Accounting, Design",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "120000/year",
    "currency": "CAD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c96c1d_89706c98337b4795a90c1663dafb7817.docx"
  },
  {
    "full_name": "Tzipora Levin",
    "email": "tziporastanger@gmail.com",
    "phone": "+1 732-992-6919",
    "whatsapp": "+1 732-998-1757",
    "location": "Jerusalem, Israel",
    "current_job_title": "Clothing Design",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Design",
      "Education"
    ],
    "tools_software": "Procreate, Photoshop, Canva,",
    "languages": "English",
    "roles_seeking": "Primarily interested in design-focused creative roles, while remaining open to other computer-based opportunities.",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/43e0b8_b6f1cb1038b04008b4c999a5aa9782b5.pdf"
  },
  {
    "full_name": "Sasha Goldstein",
    "email": "sgoldstein219@gmail.com",
    "phone": "+1 845-263-6962",
    "whatsapp": "+1 845-263-6962",
    "location": "Suffern, New York, USA",
    "current_job_title": "Non",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Not proficient in any tools",
    "languages": "English, Yiddish",
    "roles_seeking": "Most entry-level roles including billing, customer service, etc.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8bda86_0fd1a96c2b33461f94b2200f4cac0aa9.pdf"
  },
  {
    "full_name": "Roizy Hershkowitz",
    "email": "rosyre14@gmail.com",
    "phone": "+1 845-729-9728",
    "whatsapp": "+1 845-729-9728",
    "location": "Spring Valley, NY",
    "current_job_title": "Staff Coordinator, Family Liaison, Care Managers supervisor, Mental Health Clinic Supervisor",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare",
      "Customer Support"
    ],
    "tools_software": "Monday.com, Excel, QB, Word, Outlook, Google smartsheets",
    "languages": "English, Yiddish, Hebrew",
    "roles_seeking": "Program Coordinator or Operation Manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "120/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4d896c_fc80819dc4f646d2aaf9a6af8a71e5a8.pdf"
  },
  {
    "full_name": "Igor Shalomov",
    "email": "xprmngt@gmail.com",
    "phone": "+1 929-426-9378",
    "whatsapp": "+1 929-426-9378",
    "location": "Cherry Hill, NJ, US",
    "current_job_title": "Accountant",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "ABS, Excel, ProSeries, SAP",
    "languages": "English, Russian",
    "roles_seeking": "Accounting, Bookkeeping, IT, Software, AI",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "85000/year",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/529344_d1b2e9c434184027b16ee7612b139de9.pdf"
  },
  {
    "full_name": "Esther Treblow",
    "email": "estherbenveniste@outlook.com",
    "phone": "+972 55-322-5038",
    "whatsapp": "+972 55-322-5038",
    "location": "Jerusalem, Israel",
    "current_job_title": "Assistant",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "accounting, excel",
    "languages": "english",
    "roles_seeking": "trainee accountant/ bookkeeper or something similar",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/53c638_60325a28f9ac490b8f9aeb4b318c84b1.pdf"
  },
  {
    "full_name": "Moshe Perl",
    "email": "mosheperl21@gmail.com",
    "phone": "+1 848-329-7863",
    "whatsapp": "+1 848-329-7863",
    "location": "Toms River",
    "current_job_title": "Sales rep",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Quickbooks, google docs, google sheets, excel",
    "languages": "Yiddish, english.",
    "roles_seeking": "Room for growth",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "60000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/df02a2_ba3ec13bf9f94c16b6bf96e5abf9a170.pdf"
  },
  {
    "full_name": "Rina Braun",
    "email": "rinasimonovits@gmail.com",
    "phone": "+972 53-394-6356",
    "whatsapp": "+1 845-826-1512",
    "location": "Jerusalem",
    "current_job_title": "None",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Office, Smartsheet",
    "languages": "English",
    "roles_seeking": "Remote office and/or remote Interior Design positions",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/91fdf5_9a0ff143d38a486e84f3d089c60ee826.pdf"
  },
  {
    "full_name": "Yehoshua Grossnass",
    "email": "yehoshuagrossnass@gmail.com",
    "phone": "+44 7564 510753",
    "whatsapp": "+44 7564 510753",
    "location": "Jerusalem",
    "current_job_title": "Studying in mir yeshiva",
    "education_level": "Associate's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Excel etc",
    "languages": "English Yiddish and Hebrew",
    "roles_seeking": "Any with good exposure and knowledge",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "0/hour",
    "currency": null,
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/498558_16e0693eea324eba9d2727ce16406825.docx"
  },
  {
    "full_name": "Chaya Mushka Slavin",
    "email": "cmsilberg@gmail.com",
    "phone": "+1 917-515-1709",
    "whatsapp": "+507 6835-7971",
    "location": "Panamá City",
    "current_job_title": ".",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Windows (excel power point word) Google (spread sheets slides word drive) Wordpress",
    "languages": "English Spanish Hebrew",
    "roles_seeking": "Accounting",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "35/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e89fe9_3a655897cf8345dc9c2bdc26ee572c99.pdf"
  },
  {
    "full_name": "Yermy Weiss",
    "email": "getitbeforeyoulooseit@gmail.com",
    "phone": "+1 347-515-2564",
    "whatsapp": "+1 347-515-2564",
    "location": "Brooklyn, NY",
    "current_job_title": "Project Manager",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Jira, Microsoft Office,",
    "languages": "English, Yiddish",
    "roles_seeking": "Property Management",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "70000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7f0f7a_b4ee236561b4475b841264e61ed43f72.pdf"
  },
  {
    "full_name": "Yossi Gerendasi",
    "email": "ythc123@gmail.com",
    "phone": "+972 53-310-8003",
    "whatsapp": "+972 2-650-0878",
    "location": "Beitar Illit",
    "current_job_title": "Medical Biller",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Healthcare",
      "Education",
      "Marketing"
    ],
    "tools_software": "FacilitEase",
    "languages": "English, Yiddish, Hebrew, Spanish",
    "roles_seeking": "Medical Billing, Title Insurance.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/fccd09_ab60c6eb10fd49f2bbed08427085f9f1.pdf"
  },
  {
    "full_name": "Broje Reiser Averbuj",
    "email": "brojereiser770@gmail.com",
    "phone": "+54 9 11 3083-3692",
    "whatsapp": "+54 9 11 3083-3692",
    "location": "Buenos aires",
    "current_job_title": "Marketing, Design, and Inventory Coordinator",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Education",
      "Healthcare"
    ],
    "tools_software": "python, adobe, canva, excel",
    "languages": "english, Spanish, Hebrew, and Portuguese",
    "roles_seeking": "Marketing, Design, Community Manager , Ecommerce seller",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "four/five hours per day",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/0d262c_d88e25bfc636453191fa3eae3953b960.pdf"
  },
  {
    "full_name": "Shira Dardashty",
    "email": "shiradardashty14@gmail.com",
    "phone": "+1 818-738-0816",
    "whatsapp": "+1 818-738-0816",
    "location": "Brooklyn",
    "current_job_title": "Aba",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Marketing",
      "Healthcare"
    ],
    "tools_software": "Python",
    "languages": "English, Hebrew",
    "roles_seeking": "Aba, available opportunities",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "40/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/4b7081_79d126cbdb094aaaaec6c11848abe7e7~mv2.jpg"
  },
  {
    "full_name": "Rivki Silber",
    "email": "rivkisilber@gmail.com",
    "phone": "+972 58-532-4742",
    "whatsapp": "+972 58-532-4742",
    "location": "Jerusalem, Israel",
    "current_job_title": "Executive Assistant",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Marketing",
      "Other"
    ],
    "tools_software": "Office tools",
    "languages": "English, Yiddish, Hebrew",
    "roles_seeking": "Administrative, Executive Assistance, legal Assistant",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "34/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/de6640_64f6e5a7cd43433ab440fc2115ae2365.pdf"
  },
  {
    "full_name": "yair shloush",
    "email": "yairshloush@gmail.com",
    "phone": "+1 908-858-3243",
    "whatsapp": "+1 917-780-5671",
    "location": "New York",
    "current_job_title": "Graduation",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Marketing",
      "Other"
    ],
    "tools_software": "Microsoft office",
    "languages": "English",
    "roles_seeking": "Operations , Procurement,  logistics",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d9a57f_90fb39cad9de4a069c3b51c1d727c32c.pdf"
  },
  {
    "full_name": "Miriam Teitelbaum",
    "email": "teitelbaumbruchy@gmail.com",
    "phone": "+972 54-723-9949",
    "whatsapp": "+972 54-723-9949",
    "location": "Safed isreal",
    "current_job_title": "Not working currently",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "Not really proficient in any",
    "languages": "English  yiddish",
    "roles_seeking": "Organization skills",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "80/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/26023a_ded2f381e2224a22a58fdb274d30ce7a~mv2.jpg"
  },
  {
    "full_name": "Moshe levy",
    "email": "momolevy21@gmail.com",
    "phone": "+1 845-538-0676",
    "whatsapp": "+1 845-538-0676",
    "location": "New City",
    "current_job_title": "Manager",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support",
      "Other:"
    ],
    "tools_software": "Word canva etc",
    "languages": "English yiddish. Hebrew conversational",
    "roles_seeking": "Remote",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f27cc5_39ce7af7d4734fe09ea2a52182e8b315.pdf"
  },
  {
    "full_name": "Shmuli Kahan",
    "email": "info.sfksales@gmail.com",
    "phone": "+972 58-324-6100",
    "whatsapp": "+972 58-324-6100",
    "location": "Jerusalem, Israel",
    "current_job_title": "Sales",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Education",
      "Customer Support",
      "Marketing",
      "Design"
    ],
    "tools_software": "Amazon, Ebay, Educational Programs",
    "languages": "English, Yiddish, Hebrew",
    "roles_seeking": "Administration",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "120000/year",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f99248_d232cd22bd3e42b0ac140c0e80877c93.doc"
  },
  {
    "full_name": "Chaim Teitelbaum",
    "email": "chaim1284@gmail.com",
    "phone": "+1 917-613-1284",
    "whatsapp": "+1 917-613-1284",
    "location": "Brooklyn usa",
    "current_job_title": "Warehouse manager",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Slack excel",
    "languages": "Yiddish and English",
    "roles_seeking": "Warehouse or office",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "90000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/98a585_b2d61ff577d342388a37a0e364cab382.pdf"
  },
  {
    "full_name": "Julia Malove",
    "email": "juliamalove17@gmail.com",
    "phone": "+1 754-213-9190",
    "whatsapp": "+1 754-213-9190",
    "location": "Manhattan",
    "current_job_title": "ABA shadow, student",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "Excel",
    "languages": "English , spanish, português",
    "roles_seeking": "Any",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "35/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8594a2_fd41be322e3b45eb846cde1666cc15ab.pdf"
  },
  {
    "full_name": "Ahron Eli Zimbler",
    "email": "zimblerahron@gmail.com",
    "phone": "+972 55-249-4938",
    "whatsapp": "+972 55-249-4938",
    "location": "Beersheva, Israel",
    "current_job_title": "Operation management",
    "education_level": "Associate's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Microsoft, quickbooks, CRM",
    "languages": "English",
    "roles_seeking": "Customer support, property management",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "45/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/00b8e1_6ddcc0cf713d4867b57898d2dafa63d8.pdf"
  },
  {
    "full_name": "Avigail",
    "email": "avigailhalevy03@gmail.com",
    "phone": "+1 718-964-8114",
    "whatsapp": "+1 718-964-8114",
    "location": "Brooklyn, New York",
    "current_job_title": "Accountant",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "ATX, Quickbooks, Microsoft Excel, Word",
    "languages": "English and Hebrew",
    "roles_seeking": "Accountant",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/563e14_69ecd94d3d4e4527b7e4021239b0ee9d.pdf"
  },
  {
    "full_name": "Sarah Gutman",
    "email": "rivkyguttman18@gmail.com",
    "phone": "+1 929-568-8331",
    "whatsapp": "+1 646-229-7576",
    "location": "Isreal",
    "current_job_title": "Case Manager for teens at risk",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Marketing"
    ],
    "tools_software": "Google Workspace, Word, DocuSign, Popwerpoint, Adobe,",
    "languages": "English, Yiddish, Hebrew",
    "roles_seeking": "Office Manager, Secretarial, Customer service,Real Estate.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/563c86_2557216282a943539cd7d12dc081bf49.docx"
  },
  {
    "full_name": "Mindy kahan",
    "email": "mindykahan1@gmail.com",
    "phone": "+1 347-764-0916",
    "whatsapp": "+1 347-764-0916",
    "location": "Hollywood Florida",
    "current_job_title": "Prior authorization specialist",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare",
      "Education"
    ],
    "tools_software": "Most computer work",
    "languages": "English",
    "roles_seeking": "ABA Program supervisor",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "60000/year",
    "currency": "American",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2bb5ee_849b2882e19a4445844e96c00eef3141.pdf"
  },
  {
    "full_name": "Perle Leffel",
    "email": "smilingrps2@gmail.com",
    "phone": "+1 718-490-0999",
    "whatsapp": "+1 718-490-0999",
    "location": "USA",
    "current_job_title": "Administrator/ Finance",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "SAP, Quickbooks, Microsoft Office",
    "languages": "English, Hebrew, Yiddish, German, French, some Italian",
    "roles_seeking": "remote admin, finance, language application, open to learn anything new, im a fast learner",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "75000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/0da091_abe21a94eda24995892b8662f8e6f176.pdf"
  },
  {
    "full_name": "Eli Moore",
    "email": "elimoore0543@gmail.com",
    "phone": "+972 52-824-9297",
    "whatsapp": "+972 52-824-9297",
    "location": "Jerusalem",
    "current_job_title": "Trying out being a Property broker",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other:"
    ],
    "tools_software": "Regular computer tools",
    "languages": "English Hebrew",
    "roles_seeking": "Property management",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "British Pounds",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b1bb05_65336ae4ba6847d1bb5956c5ed69e8b1.pdf"
  },
  {
    "full_name": "Moishy Lipschitz",
    "email": "moishylip@gmail.com",
    "phone": "+1 848-240-5061",
    "whatsapp": "+1 848-240-5061",
    "location": "Queens",
    "current_job_title": "Manger",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Design",
      "Other"
    ],
    "tools_software": "All",
    "languages": "English Spanish Hebrew",
    "roles_seeking": "Managerial",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50/year",
    "currency": "Us",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/98ca70_a4cea0510a6741b0a70c4cb45a76705f.pdf"
  },
  {
    "full_name": "Tzvi Stern",
    "email": "tzvi.stern@gmail.com",
    "phone": "+1 646-948-3010",
    "whatsapp": "+972 54-345-0469",
    "location": "Israel",
    "current_job_title": "Fractional CFO",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Healthcare",
      "Other"
    ],
    "tools_software": "Excel, Quickbooks, Netsuite, other accounting packages, Au",
    "languages": "English, Hebrew",
    "roles_seeking": "Controller - CFO",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "250/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/573e0a_28e87dae7ca5462e9e671ee4f11e7dd1~mv2.jpg"
  },
  {
    "full_name": "Nechama Helmreich",
    "email": "nechamarosenberg123@gmail.com",
    "phone": "+1 929-380-2154",
    "whatsapp": "+1 929-380-2154",
    "location": "Jerusalem, Israel",
    "current_job_title": "Accountant",
    "education_level": "Master's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Microsoft Office, Quickbooks",
    "languages": "English",
    "roles_seeking": "Accountant/CPA",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "40/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/85fe11_386e7c756833467f8af0284a19769a22.docx"
  },
  {
    "full_name": "Dov Gefner",
    "email": "bgefner@gmail.com",
    "phone": "+1 718-483-4061",
    "whatsapp": "+1 718-483-4061",
    "location": "Lakewood",
    "current_job_title": "BT",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "Microsoft office, central reach",
    "languages": "Yiddish, English, Hebrew",
    "roles_seeking": "Legal field",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "140000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/6f787a_3d76bb43421247cf8f551b3c533bbe11.pdf"
  },
  {
    "full_name": "Zearch paluch",
    "email": "rivipaluch@gmail.com",
    "phone": "+44 7442 579689",
    "whatsapp": "+44 7442 579689",
    "location": "London uk / Jerusalem israel",
    "current_job_title": "Non",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other:"
    ],
    "tools_software": "Starting",
    "languages": "Yiddish English hebrew",
    "roles_seeking": "Any",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "16/hour",
    "currency": "Pound",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/6dd19c_c88fb2f7fc754801bdc82f66e0344aad~mv2.jpg"
  },
  {
    "full_name": "Mammel Hager",
    "email": "mammelhager@gmail.com",
    "phone": "+1 929-993-4185",
    "whatsapp": "+1 929-993-4185",
    "location": "Jerusalem",
    "current_job_title": "Experienced Bookkeeper",
    "education_level": "Associate's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Quickbooks, appfolio, net suite",
    "languages": "English, Yiddish",
    "roles_seeking": "Bookkeeper, or any other roles",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "70000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/da37df_162b219f89f34f77a55cb040a7a7fc44.pdf"
  },
  {
    "full_name": "kalmen perlstein",
    "email": "kalmenperl2000@gmail.com",
    "phone": "+44 7862 944926",
    "whatsapp": "+44 7862 944926",
    "location": "antwerp",
    "current_job_title": "administrator",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "windows",
    "languages": "yiddish english",
    "roles_seeking": "administrator work / office",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/946a08_a9226877846b4725a5adef77a6abcb74.pdf"
  },
  {
    "full_name": "David Rabinowitz",
    "email": "duvirab@gmail.com",
    "phone": "+972 50-709-5772",
    "whatsapp": "+44 7791 074462",
    "location": "Ramat beit shemesh",
    "current_job_title": "Self employed",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Yardi Outlook Word Spreadsheet and more",
    "languages": "English and Yiddish and a hebrew is more basic",
    "roles_seeking": "Real Estate or Customer Services",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "90/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4ca632_bc235ba9203b468e89ca258bcb72b956.pdf"
  },
  {
    "full_name": "Yosef Malek",
    "email": "emtcares@gmail.com",
    "phone": "+1 845-323-7717",
    "whatsapp": "+1 845-323-7717",
    "location": "Hillside",
    "current_job_title": "Public School teacher",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Education",
      "Healthcare",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Basic Word, Excel etc. Google Drive, sheets, slides, etc",
    "languages": "English, Yiddish",
    "roles_seeking": "I am flexible, but avoid commission based trades",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "75000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/6a1e73_17dedac390ec42e599d2fa8884dde6cd.pdf"
  },
  {
    "full_name": "Chaim Miller",
    "email": "chaimmiller47@gmail.com",
    "phone": "+1 929-524-6462",
    "whatsapp": "+972 50-961-6970",
    "location": "Jerusalem",
    "current_job_title": "L",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [],
    "tools_software": "N",
    "languages": "English, Hebrew, Yiddish",
    "roles_seeking": "Open",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "40000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2bc030_f8a5deb7cb1044b7aa3a88842ecc3c03.pdf"
  },
  {
    "full_name": "Yossi Melamed",
    "email": "yossimelamed05@gmail.com",
    "phone": "+1 323-383-3990",
    "whatsapp": "+1 323-383-3990",
    "location": "Phoenix, AZ",
    "current_job_title": "N/A",
    "education_level": "Associate's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Property management software like pliers and yardi",
    "languages": "English, Yiddish",
    "roles_seeking": "Property management or real estate",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "22/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1f4bfc_4dd9a45815f342cf8ea07017968e675c.pdf"
  },
  {
    "full_name": "Samuel (Shmuli) Heimann",
    "email": "shmuliheimann@gmail.com",
    "phone": "+32 475 97 15 99",
    "whatsapp": "+32 475 97 15 99",
    "location": "Antwerpen",
    "current_job_title": "Freelancer",
    "education_level": "Associate's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Microsoft",
    "languages": "English, Dutch, Yiddish, Hebrew, French",
    "roles_seeking": "I’m very flexible and willing to try anything. I prefer to work from home and could commute too.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d3aada_9c5f756bfc30436d8a3613e36742357e.pdf"
  },
  {
    "full_name": "chaya gheffen",
    "email": "cgheffen@gmail.com",
    "phone": "+32 489 14 76 36",
    "whatsapp": "+32 489 14 76 36",
    "location": "belgium",
    "current_job_title": "teacher",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Design"
    ],
    "tools_software": "Figma",
    "languages": "yidish flemish and english",
    "roles_seeking": "bookkeeper or billing something remote",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": null,
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/829cef_1a899817ee334098bf1ce4a15d0f5ad8.docx"
  },
  {
    "full_name": "Chaim Tzvi Binstock",
    "email": "chaimtzvibinstock@gmail.com",
    "phone": "+972 54-845-2064",
    "whatsapp": "+972 53-226-2526",
    "location": "Beit Shemesh, Israel",
    "current_job_title": "Operations Manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Quickbooks, Google Suite, Microsoft Suite, Slack,",
    "languages": "English, Hebrew",
    "roles_seeking": "Operational management but also am open to new avenues",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "100000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/108b99_9e7cd684a61e4eed8b65ee94c0656617.pdf"
  },
  {
    "full_name": "Alexander Kleyman",
    "email": "alexkleyman@gmail.com",
    "phone": "+1 716-481-5638",
    "whatsapp": "+1 716-481-5638",
    "location": "Buffalo",
    "current_job_title": "Support engineer",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Customer Support",
      "Healthcare"
    ],
    "tools_software": "Java, .Net, SQl, Java script",
    "languages": "English, Russian",
    "roles_seeking": "Developer, Analyst, Project Manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "120000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9a2c76_94b3b1bee3234619be7792c7307276f7.pdf"
  },
  {
    "full_name": "Zev Edelstein",
    "email": "zvedelstein@gmail.com",
    "phone": "+1 414-389-7712",
    "whatsapp": "+1 414-389-7712",
    "location": "Milwaukee, WI (willing to relocate l)",
    "current_job_title": "Do many part time things virtually",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Design",
      "Education",
      "Customer Support",
      "Other"
    ],
    "tools_software": "General",
    "languages": "English",
    "roles_seeking": "Shlichus style or connecting",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "60/year",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c0c5d8_30f2a112b4cc4fde86f3a215c08abb44.pdf"
  },
  {
    "full_name": "Shira Bamberger",
    "email": "shirbambi@gmail.com",
    "phone": "+972 53-538-0445",
    "whatsapp": "+32 487 88 80 18",
    "location": "Jerusalem",
    "current_job_title": "Secretary",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Customer Support"
    ],
    "tools_software": "Canva",
    "languages": "English, French, Hebrew, Yiddish, Dutch",
    "roles_seeking": "Administrative or customer service",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/6de0ba_ab00d883b5304832bdf83cdfec0f5d49~mv2.jpeg"
  },
  {
    "full_name": "Chavy Goldhersch",
    "email": "chavy3501@gmail.com",
    "phone": "+1 929-993-6261",
    "whatsapp": "+1 929-993-6261",
    "location": "Jerusalem",
    "current_job_title": "Assistant",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Design",
      "Customer Support",
      "Education"
    ],
    "tools_software": "Slack",
    "languages": "Yiddish, Hebrew and English",
    "roles_seeking": "Roles involving coordination, communication, and organization",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/bba032_afaabf078c37460697da7621e06ed638.pdf"
  },
  {
    "full_name": "Elizabeth Austein",
    "email": "elizabethaustein@gmail.com",
    "phone": "+1 914-715-3232",
    "whatsapp": "+1 914-715-3232",
    "location": "Boca Raton Florida",
    "current_job_title": "Teacher / special ed",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "Google",
    "languages": "English",
    "roles_seeking": "More leadership out of the classroom",
    "employment_type": [],
    "desired_salary": "80000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/779cfd_dc44c46ee70d4a6ab7c0c86331e1f90e.pdf"
  },
  {
    "full_name": "Aryeh Fried",
    "email": "aryehfried18@gmail.com",
    "phone": "+1 347-359-8057",
    "whatsapp": "+1 347-359-8057",
    "location": "Far Rockaway/Five",
    "current_job_title": "Inventory Manager for Weekly Hype",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Education",
      "Customer Support"
    ],
    "tools_software": "Excel, QuickBooks Online, Microsoft Word",
    "languages": "English, Spanish",
    "roles_seeking": "Bookkeeper, Customer Service Representee",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "21/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f9cb67_0e4d31a43de74e81a0d0ca4023e324de.docx"
  },
  {
    "full_name": "Daniel Adam",
    "email": "dadamdaniel123@gmail.con",
    "phone": "+1 551-236-7413",
    "whatsapp": "+1 551-236-7413",
    "location": "Hollywood, FL, USA",
    "current_job_title": "Office Manager & Communications Specialist",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Asana, Canva, Adobe, MS 365, Google Suite, Wix",
    "languages": "English",
    "roles_seeking": "Roles in administration, marketing, PR, or a creative field. Open to full time or part time.",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "26/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d947c6_db87f8b1975f43928a1c569e3c121adb.pdf"
  },
  {
    "full_name": "Sharleen Tey",
    "email": "sharleen.tey26@gmail.com",
    "phone": "+1 480-300-2602",
    "whatsapp": "+1 480-300-2602",
    "location": "Hollywood",
    "current_job_title": "Teacher",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Microsoft",
    "languages": "English and Farsi",
    "roles_seeking": "ABA Program Supervisor",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "55000/year",
    "currency": "USA",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/031020_bbc7aa800608442ab8f536ca03f9b654.pdf"
  },
  {
    "full_name": "iaacob cobe",
    "email": "iaacobe@gmail.com",
    "phone": "+972 58-322-1698",
    "whatsapp": "+972 58-322-1698",
    "location": "jerusalem, israel",
    "current_job_title": "social worker",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "Microsoft Word, Microsoft Excel (basic), Google Drive, Gmail, data entry, basic computer skills",
    "languages": "Spanish (native), Hebrew (near-native), English (basic)",
    "roles_seeking": "Remote positions in social services, behavioral support, or program coordination, particularly roles working with Spanish-speaking populations and involving team support, client interaction, and structured intervention programs.",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "dolar",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/19a992_b1b67721dc0c499a83594023a4efd06e.docx"
  },
  {
    "full_name": "NANCY KREMER",
    "email": "nancykre@iinet.net.au",
    "phone": "+61 422 907 692",
    "whatsapp": "+61 422 907 692",
    "location": "Perth",
    "current_job_title": "Clinical Nutritionist",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare"
    ],
    "tools_software": "Microsoft Excel",
    "languages": "SPANISH, ENGLISH, HEBREW",
    "roles_seeking": "ANY REMOTE JOB",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ec7def_aa23eb81b63c484784089e6e30bb14fe.docx"
  },
  {
    "full_name": "Esther Dahan",
    "email": "edahan2017@yula.org",
    "phone": "+972 53-373-1104",
    "whatsapp": "+972 53-373-1104",
    "location": "Jerusalem",
    "current_job_title": "Marketing manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing"
    ],
    "tools_software": "LinkedIn, sales force, mail chimp",
    "languages": "English and hebrew",
    "roles_seeking": "Outbound marketing",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "28/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b58049_ffeb2ac3b088457a933d5a1f43e8a178.pdf"
  },
  {
    "full_name": "Maya Weiss",
    "email": "doubleyou11@gmail.com",
    "phone": "+1 848-333-0884",
    "whatsapp": "+1 848-333-0884",
    "location": "Toms river",
    "current_job_title": "Sales development representative",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Marketing",
      "Education",
      "Other"
    ],
    "tools_software": "Word, google docs, excel",
    "languages": "English",
    "roles_seeking": "Remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b34e66_b5185a0029d44890bc52e2788bf90e37.pdf"
  },
  {
    "full_name": "Miriam Khiyaev",
    "email": "miriamfried613@gmail.com",
    "phone": "+972 58-323-6972",
    "whatsapp": "+972 58-422-2087",
    "location": "Jerusalem",
    "current_job_title": "Teacher",
    "education_level": "Associate's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "Ready to learn anything",
    "languages": "Hebrew, English",
    "roles_seeking": "Part time",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1b98aa_f2c9aec3d04a4960a1d21a782d03e53c.pdf"
  },
  {
    "full_name": "Rachel Grotsky",
    "email": "grotskygevents@gmail.com",
    "phone": "+972 55-680-3327",
    "whatsapp": "+972 55-680-3324",
    "location": "Bet Shemesh",
    "current_job_title": "Event coordinator",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other:"
    ],
    "tools_software": "None",
    "languages": "English",
    "roles_seeking": "Jobs that need no experience",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/81b6f2_b5222e0dcc1b40719cad1010b4ed6cb6.docx"
  },
  {
    "full_name": "Cheryl Weiss",
    "email": "weissc144@gmail.con",
    "phone": "+1 347-684-3539",
    "whatsapp": "+1 347-684-3539",
    "location": "Flushing NY",
    "current_job_title": "Assurance associate",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare",
      "Tech/Software"
    ],
    "tools_software": "Excel",
    "languages": "English",
    "roles_seeking": "Accounting",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "90000/year",
    "currency": "Filled",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/dbc4ac_94cbc1f5e7f54aeeb6a6761d5d37c95c.pdf"
  },
  {
    "full_name": "Bennett Berger",
    "email": "bennett.berger@gmail.com",
    "phone": "+1 917-533-0877",
    "whatsapp": "+1 917-533-0877",
    "location": "Lawrence",
    "current_job_title": "controller/Manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare",
      "Other"
    ],
    "tools_software": "Quickbooks/ERP systems",
    "languages": "English",
    "roles_seeking": "Controller/Bookkeeper",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "40/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d6f1d6_aad89c89b7ef491cb070b3d27c98640e.docx"
  },
  {
    "full_name": "Shalom David Hananya",
    "email": "ivrianochi02@gmail.com",
    "phone": "+972 54-288-7052",
    "whatsapp": "+972 54-288-7052",
    "location": "Ramat Beit Shemesh",
    "current_job_title": "Mortgage broker",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Excel and crms",
    "languages": "English, Hebrew",
    "roles_seeking": "Remote",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/0ae3bc_5c9b0b3c83194a7ab8edd06d2bb6c7a0.pdf"
  },
  {
    "full_name": "Saul L. Weiner",
    "email": "sleibweiner3@gmail.com",
    "phone": "+1 856-816-5128",
    "whatsapp": "+1 856-816-5128",
    "location": "Flushing",
    "current_job_title": "student",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Design",
      "Healthcare"
    ],
    "tools_software": "Excel, Powerpoint, Visual, NCS, Java",
    "languages": "English",
    "roles_seeking": "Summer Internship - Audit/Tax",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c64cd0_082f489af29f4ee1884a30e05dc515ff.pdf"
  },
  {
    "full_name": "Chaim samuels",
    "email": "ycsamuels4117@gmail.com",
    "phone": "+44 7782 614969",
    "whatsapp": "+972 50-288-3358",
    "location": "Israel",
    "current_job_title": "Operations & Customer Service Associate",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Design"
    ],
    "tools_software": "Google Docs, Google Sheets, Gmail, canva",
    "languages": "English, Hebrew, Yiddish",
    "roles_seeking": "Customer Support, Operations, and Event Coordination roles where I can manage tasks, work with people, and handle fast-paced environments",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/3f9b11_bf85adeba08a410baae49ac0155156fb.pdf"
  },
  {
    "full_name": "Shifra Finkelstein",
    "email": "shifra156@gmail.com",
    "phone": "+1 732-703-1598",
    "whatsapp": "+1 732-703-1598",
    "location": "Boca Raton, Florida",
    "current_job_title": "Collection Specialist",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Customer Support"
    ],
    "tools_software": "Salesforce CRM, Zoom, Google Docs, hubspot..",
    "languages": "English",
    "roles_seeking": "Remote sales work or finance roles",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "75000/year",
    "currency": "USA",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f01ece_bd86e1880e2a4da2b77b24b80c84bd07.pdf"
  },
  {
    "full_name": "Israel Leitman Chouveke",
    "email": "israelchouveke@gmail.com",
    "phone": "+55 11 94163-1800",
    "whatsapp": "+55 11 94163-1800",
    "location": "São Paulo, Brazil",
    "current_job_title": "Manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Marketing",
      "Healthcare"
    ],
    "tools_software": "Excel",
    "languages": "Spanish, English, Hebrew",
    "roles_seeking": "Manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "Dolar",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f6a559_b7262e9108cc49f09469b374d4a63df2.pdf"
  },
  {
    "full_name": "Avigail Amar",
    "email": "gailib704@gmail.com",
    "phone": "+1 407-715-8988",
    "whatsapp": "+1 407-715-8988",
    "location": "Orlando, Florida",
    "current_job_title": "N/A",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "N/A",
    "languages": "English, Hebrew",
    "roles_seeking": "Fundraising and operations",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "$",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/501fd0_6ef3d271f27c492ca4fa14d98282bee6.pdf"
  },
  {
    "full_name": "Shoshana Elisheva Lefkowitz",
    "email": "elisheva2222@gmail.com",
    "phone": "+1 845-238-9408",
    "whatsapp": "+1 845-907-1039",
    "location": "Monroe, USA",
    "current_job_title": "Art Curator",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Design",
      "Customer Support",
      "Healthcare",
      "Other"
    ],
    "tools_software": "Illustrator, Canva, Adobe Acrobat, Google Sheets, Google Docs, Google Drive",
    "languages": "English, Yiddish",
    "roles_seeking": "Interior design, and any remote positions",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/69ea5b_74e249c6bd3140c393a815c5dd6a5937.pdf"
  },
  {
    "full_name": "Yosef Rosenberg",
    "email": "jm.rosenberg48@gmail.com",
    "phone": "+1 516-448-3253",
    "whatsapp": "+1 516-448-3253",
    "location": "Far rockaway, NY",
    "current_job_title": "Senior Accountant",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare",
      "Other"
    ],
    "tools_software": "Quickbooks, Sage Intacct, Fund EZ, Entrata, Yardi, AppFolio, Excel, Stampli, PCC, and RFMS",
    "languages": "English",
    "roles_seeking": "Senior accounting, operations, and compliance",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "160000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8cd4dd_2f2fc8418a4743d4b8e9ba1e9018e73b.pdf"
  },
  {
    "full_name": "Cheryl Weiss",
    "email": "weissc144@gmail.clm",
    "phone": "+1 347-684-3539",
    "whatsapp": "+1 347-684-3539",
    "location": "Flushing, NY",
    "current_job_title": "Accountant and consultant",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare"
    ],
    "tools_software": "Excel",
    "languages": "English and conversational Hebrew",
    "roles_seeking": "Consulting or accounting",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "95000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/dbc4ac_5e88fe818298478f8672221d4535de45.pdf"
  },
  {
    "full_name": "Leanne Praw",
    "email": "leannepzim@gmail.com",
    "phone": "+1 310-908-4208",
    "whatsapp": "+1 310-908-4208",
    "location": "Florida, USA",
    "current_job_title": "Fractional CFO/Controller",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Other"
    ],
    "tools_software": "Quickbooks, MS Office Suite (Excel, Word, Powerpoint), Salesforce, Teams, Zoom, Mastercontrol, Slack",
    "languages": "English",
    "roles_seeking": "Fractional Controller/CFO roles preferrably",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "225000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/cef595_20b098b9176e46faa3270105d872cf93.pdf"
  },
  {
    "full_name": "Benjamin Levin",
    "email": "benjaminl5259@gmail.com",
    "phone": "+1 347-896-0911",
    "whatsapp": "+1 347-896-0911",
    "location": "Monsey",
    "current_job_title": "SEO Lead and Web Developer",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing"
    ],
    "tools_software": "WordPress, Javascript, HTML, CSS, Python",
    "languages": "English, Yiddish, Spanish",
    "roles_seeking": "Part time, contract, full time",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4d25dd_958bbb7ac1b342e480582ad5671a62a5.pdf"
  },
  {
    "full_name": "Shimon Kolodny",
    "email": "shimmykol@gmail.com",
    "phone": "+1 845-570-1998",
    "whatsapp": "+1 845-570-1998",
    "location": "BROOKLYN",
    "current_job_title": "Account",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Excel QuickBooks",
    "languages": "English",
    "roles_seeking": "Accounting",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "90000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/078938_3fc845f4db824592b520ec353686886c.pdf"
  },
  {
    "full_name": "Rosenberg Raizy",
    "email": "rosenbergraizy3@gmail.com",
    "phone": "+32 479 15 06 04",
    "whatsapp": "+32 86 33 48 24",
    "location": "Antwerp, Belgium",
    "current_job_title": "Secretary",
    "education_level": "Associate's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Word, Excel",
    "languages": "Yiddish, English, Dutc",
    "roles_seeking": "Bookkeper",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "euro",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/448b1e_3c5f18f4009649a7aa4f0e47555f996e.pdf"
  },
  {
    "full_name": "Boruch Schoemann",
    "email": "boruchschoemann@gmail.com",
    "phone": "+44 7751 259270",
    "whatsapp": "+44 7751 259270",
    "location": "London",
    "current_job_title": "I’m currently studying in yeshiva but I have spare time and I want to peruse an remote online job opportunity",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Tech/Software",
      "Other"
    ],
    "tools_software": "I’m good with excel etc",
    "languages": "English and my Hebrew is ok it’s not perfect tho",
    "roles_seeking": "I’m seeking some sort of online remote job in salesmanship or AI ENGINEERING",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/49fe18_91edd2d5d2bf4fd7a4bc87eb0166b177.pdf"
  },
  {
    "full_name": "Esther Styller",
    "email": "estyller@gmail.com",
    "phone": "+1 718-316-7613",
    "whatsapp": "+1 718-316-7613",
    "location": "Brooklyn",
    "current_job_title": "Controller",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Excel, QuickBooks, Taxact, Adobe, Word",
    "languages": "English, Russian",
    "roles_seeking": "Management",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "1200000/year",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/0f66df_19c5b464c92a45ddba4f06aea7a78c3b.pdf"
  },
  {
    "full_name": "Nicole Burlin",
    "email": "nicoleburlin@icloud.com",
    "phone": "+972 53-654-4400",
    "whatsapp": "+972 53-654-4400",
    "location": "Israel",
    "current_job_title": "Senior Account Manager / Team Lead",
    "education_level": "Associate's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Quickbooks, Sage , Priority",
    "languages": "English",
    "roles_seeking": "Accounting",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/58e30b_3f6ed19fe6954774b9ac2492790b1214.pdf"
  },
  {
    "full_name": "Rivka wiess",
    "email": "rikkiwiess2@gmail.com",
    "phone": "+1 424-283-1311",
    "whatsapp": "+1 424-283-1311",
    "location": "Los Angeles CA",
    "current_job_title": "ABA behavior technician",
    "education_level": "Associate's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Quickbooks, CRM",
    "languages": "English Hebrew",
    "roles_seeking": "Admin role or head of fundraising",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b9f2af_d7c92763013c4f7da8fc6d7f6a3c78ff.pdf"
  },
  {
    "full_name": "Philip Krinkin",
    "email": "philip@krinkin.co.za",
    "phone": "+972 58-624-5572",
    "whatsapp": "+972 58-624-5572",
    "location": "Israel",
    "current_job_title": "Financial Director",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Quick books, Sage ERP,  Office",
    "languages": "English",
    "roles_seeking": "Accounting,",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/998627_216170723fad4d8fa8fbec75e8647286.pdf"
  },
  {
    "full_name": "Anaelle",
    "email": "anaelleben12@gmail.com",
    "phone": "+1 514-649-2720",
    "whatsapp": "+1 514-649-2720",
    "location": "Montreal",
    "current_job_title": "Administrative Assistant",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Tech/Software",
      "Education",
      "Other"
    ],
    "tools_software": "Quickbooks Excel word Canva etc",
    "languages": "English,French,Spanish,Hebrew",
    "roles_seeking": "Sales, Fundraising & Operations* *Remote*",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "US",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ee3a8f_6fb74baed7f64ca59c21ae1f620f9ab4.pdf"
  },
  {
    "full_name": "Sarah Franco",
    "email": "snbats@gmail.com",
    "phone": "+503 7083 4547",
    "whatsapp": "+503 7083 4547",
    "location": "El Salvador",
    "current_job_title": "In between jobs",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing"
    ],
    "tools_software": "Microsoft Office",
    "languages": "Spanish and English",
    "roles_seeking": "Customer suport or Analysis",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/25afc7_5e410c10f2d2451bb6ce0ace3640a9aa.docx"
  },
  {
    "full_name": "Mishket brizl",
    "email": "brizelyo11@gmail.com",
    "phone": "+32 492 55 46 67",
    "whatsapp": "+32 492 55 46 67",
    "location": "Antwerpen",
    "current_job_title": "teacher",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "word,excell,",
    "languages": "English,dutch,yiddish",
    "roles_seeking": "costumer service, secratary, bookkeeping",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/dacc3e_dd8de6d8a85a4cfc9287c730f6008c73.pdf"
  },
  {
    "full_name": "Benjamin Aminzade",
    "email": "aminzade.benjamin227@gmail.com",
    "phone": "+1 347-361-3741",
    "whatsapp": "+1 347-361-3741",
    "location": "Rego Park",
    "current_job_title": "DSP",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Design",
      "Education",
      "Healthcare",
      "Other"
    ],
    "tools_software": "Powerpoint, Excel, Word",
    "languages": "English, Russian",
    "roles_seeking": "Real Estate/Child care roles. Can be flexible",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "35/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/40eb61_e0413043d6d04defb4da601e07d52617.pdf"
  },
  {
    "full_name": "Daniel Lengler",
    "email": "daniel.lengler@gmail.com",
    "phone": "+972 53-963-1300",
    "whatsapp": "+972 53-963-1300",
    "location": "safed, israel",
    "current_job_title": "IT Support",
    "education_level": "Associate's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Healthcare"
    ],
    "tools_software": "python,php,jetbrains,java,html,javascript,css,office suite",
    "languages": "English",
    "roles_seeking": "programming and software development positions",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "75/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7ebc12_84b79137710047e6ba53b0d5a1899f5c.pdf"
  },
  {
    "full_name": "Lindi Katzoff",
    "email": "lindi.katzoff@gmail.com",
    "phone": "+27 82 094 2911",
    "whatsapp": "+27 82 094 2911",
    "location": "Johannesburg South Africa",
    "current_job_title": "Office Manager",
    "education_level": "Associate's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Microsoft Word, Excel, Outlook, Canva",
    "languages": "English",
    "roles_seeking": "Office support, client relationships, personal assistant",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "32/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/6ceb76_9faebce0104c43ff9103e5f7ca911b90.pdf"
  },
  {
    "full_name": "Darren Sadman",
    "email": "fida.sales@gmail.com",
    "phone": "+27 61 580 7797",
    "whatsapp": "+27 61 580 7797",
    "location": "Johannesburg",
    "current_job_title": "Self employed",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other:"
    ],
    "tools_software": "ms office suite",
    "languages": "english",
    "roles_seeking": "operations type role",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "500/hour",
    "currency": "rand",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ed13ee_8b694e2c5b0c49d198d4c9fd70d1e185.docx"
  },
  {
    "full_name": "Yaakov Zaitschek",
    "email": "yaakzai20@gmail.com",
    "phone": "+1 414-736-8254",
    "whatsapp": "+972 53-963-5698",
    "location": "Durham CT",
    "current_job_title": "Looking for a remote job",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support",
      "Healthcare"
    ],
    "tools_software": "None really",
    "languages": "English",
    "roles_seeking": "Remote",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "29/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/151136_62fbcb52186243f995f78ef5c599d264.txt"
  },
  {
    "full_name": "Malki Klein",
    "email": "malkinussbacher@gmail.com",
    "phone": "+972 55-323-5995",
    "whatsapp": "+61 412 486 143",
    "location": "Israel",
    "current_job_title": "Secretary",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "Uptick, Quickbooks",
    "languages": "English",
    "roles_seeking": "Medical Billing, Secretary",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/95b5f4_4108739f0ac04c4aa86927339f0843b8.docx"
  },
  {
    "full_name": "Emilia Kosonen",
    "email": "emiliajkosonen@gmail.com",
    "phone": "+972 50-857-0198",
    "whatsapp": "+1 954-678-8213",
    "location": "Jerusalem, Israel",
    "current_job_title": "Student at Midrasha",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Marketing",
      "Other"
    ],
    "tools_software": "Camera Operation, Adobe Premiere, Adobe After Effects, Photoshop, Lightroom, Capcut, DaVinci Resolve, Avid, Modash, MailChimp, Social Media Management",
    "languages": "English, Finnish",
    "roles_seeking": "Video editing, production assistant, associate producer",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "22/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/aeb6f3_0b398521f20640fa8777bbd63521c2c3.pdf"
  },
  {
    "full_name": "Silky Wollner",
    "email": "sw051104@gmail.com",
    "phone": "+32 465 14 85 98",
    "whatsapp": "+32 495 81 01 41",
    "location": "Antwerpen",
    "current_job_title": "Sales representatives at shoe store",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Basic computer.....",
    "languages": "Dutch English yiddish",
    "roles_seeking": "Costumer service-communication with people-data entry- (very simple jobs)",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "13/hour",
    "currency": "Euro",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/11888f_e1d00fc8c97f46f3b00490b01f2e9e5d.pdf"
  },
  {
    "full_name": "Zevi Heimann",
    "email": "zeviheimann7@gmail.com",
    "phone": "+32 492 85 87 19",
    "whatsapp": "+32 492 85 87 19",
    "location": "Antwerp",
    "current_job_title": "Voice teacher / choir conductor",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Healthcare",
      "Other"
    ],
    "tools_software": "Microsoft Word, Excel, PowerPoint, Outlook, Google Docs, Google Sheets, Gmail.",
    "languages": "English, Dutch, Yiddish (Hebrew and French also but not fluent)",
    "roles_seeking": "Remote administrative, translation, online sale or operations support roles focused on organization and computer-based work. I’m open to related remote work.",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "16/hour",
    "currency": "Euro",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/871e26_425c9d898f24483abe26758b336a54b0.pdf"
  },
  {
    "full_name": "Lauri Kruger",
    "email": "laurikruger92@gmail.com",
    "phone": "+27 61 524 1630",
    "whatsapp": "+27 61 524 1630",
    "location": "Johannesburg",
    "current_job_title": "Senior Copywriter",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing"
    ],
    "tools_software": "Slack, Hubspot, Trello",
    "languages": "English",
    "roles_seeking": "Writing or admin positions",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "350/hour",
    "currency": "Rand",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f7e4ea_4da6b43ae8934b7f914b7696993a9022.pdf"
  },
  {
    "full_name": "Ariella Eve",
    "email": "aribelle98@gmail.com",
    "phone": "+972 53-352-0021",
    "whatsapp": "+972 53-352-0021",
    "location": "Harish Israel",
    "current_job_title": "Self employed Beautician",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Communication",
    "languages": "English (UK)",
    "roles_seeking": "Remote Customer Service",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "60",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/ce429a_085deca038eb475697021d8b8948cacf~mv2.png"
  },
  {
    "full_name": "Ari Gestetner",
    "email": "gestetnerari@gmail.com",
    "phone": "+1 414-973-9757",
    "whatsapp": "+61 435 575 770",
    "location": "NYC, USA",
    "current_job_title": "None",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "Python, JavaScript, Typescript, HTML/CSS, R",
    "languages": "English",
    "roles_seeking": "Programming and data related roles",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "36/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/3605ed_f03cc5a328444be096fa458e4655578f.pdf"
  },
  {
    "full_name": "Avi Shumacher",
    "email": "avrami127@gmail.com",
    "phone": "+972 54-530-1214",
    "whatsapp": "+972 54-530-1214",
    "location": "Tel aviv, Israel",
    "current_job_title": "Senior Enterprise Account executive",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software",
      "Other"
    ],
    "tools_software": "Hubspot, slack, Monday, Sales Navigator",
    "languages": "English, Hebrew, Spanish, Portuguese",
    "roles_seeking": "Sales, Acount Executive, I haven't added value if the company has to do with mapping technologies",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "120000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9e1d15_1dc9dbd17bea433fa6bd063f8e63f2c2.docx"
  },
  {
    "full_name": "Gila Bensusan",
    "email": "gilabensusan@gmail.com",
    "phone": "+972 50-290-3313",
    "whatsapp": "+44 7309 794806",
    "location": "jerusalem",
    "current_job_title": "secretary",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Design",
      "Education",
      "Other:",
      "Tech/Software"
    ],
    "tools_software": "Canva, excel, monday, setmore, word",
    "languages": "English",
    "roles_seeking": "Admin",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "Pounds",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9c8cda_5f5da3c460db4d25bb672055b4f65eb1.pdf"
  },
  {
    "full_name": "Menachem Perl",
    "email": "mark_perl@icloud.com",
    "phone": "+1 516-662-8078",
    "whatsapp": "+1 516-662-8078",
    "location": "Toms River, NJ USA",
    "current_job_title": "Director of Operations",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare"
    ],
    "tools_software": "Monday, HHA Exchange, salesforce",
    "languages": "English",
    "roles_seeking": "Senior operations",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "225000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b20113_2f094d821b844ff6b49f7163dfc1fe42.pdf"
  },
  {
    "full_name": "Ruth Gazale",
    "email": "gazaleruth@gmail.com",
    "phone": "+55 11 99877-2302",
    "whatsapp": "+55 11 99877-2302",
    "location": "São Paulo, Brazil",
    "current_job_title": "Teacher",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "Microsoft Word,Power Point,Excel, and Google suite",
    "languages": "English, Portuguese,Spanish and Hebrew",
    "roles_seeking": "Remote role",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9fd1da_d77b287758c44e64a5b45e3f925a9908.docx"
  },
  {
    "full_name": "tsiri schonberger",
    "email": "p0465911694@gmail.com",
    "phone": "+32 489 12 19 85",
    "whatsapp": "+32 489 12 19 85",
    "location": "antwerp",
    "current_job_title": "worker",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Education",
      "Tech/Software",
      "Other"
    ],
    "tools_software": "words exell email google",
    "languages": "jiddish english dutch",
    "roles_seeking": "office secretary",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "12/hour",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b03ab1_f5732f14e4a14247a99eb3f1b93cc01f.pdf"
  },
  {
    "full_name": "Shmuel Zaldin",
    "email": "kszaldin@gmail.com",
    "phone": "+972 53-380-2419",
    "whatsapp": "+972 53-380-2419",
    "location": "Jerusalem, Israel",
    "current_job_title": "Night seder rebbi, social work intern",
    "education_level": "Master's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Workspace, Office",
    "languages": "English, Hebrew",
    "roles_seeking": "Chinuch, counselling, social work, administration",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "70/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/64c441_9756c0d1b5884c8992b45861bf32c4cd.pdf; https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/64c441_d06e4f855f1248389cc16b22c4d35c62.pdf"
  },
  {
    "full_name": "Pinches Lieberman",
    "email": "pincheslieberman@gmail.com",
    "phone": "+32 488 43 53 23",
    "whatsapp": "+44 7729 853588",
    "location": "Antwerp, Belgium",
    "current_job_title": "Lead purchaser",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software",
      "Other"
    ],
    "tools_software": "Office, tradepeg,",
    "languages": "English, Yiddish",
    "roles_seeking": "I have experience in e-commerce",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "90000/year",
    "currency": "Euro",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/a1d0b6_d0fabf43a1cb4804b47c357d1c072d83.pdf"
  },
  {
    "full_name": "Azaria Bin-Nun",
    "email": "binnunazaria@gmail.com",
    "phone": "+1 201-835-0423",
    "whatsapp": "+1 201-835-0423",
    "location": "TEANECK, New Jersey",
    "current_job_title": "Amazon and Walmart Marketplace Expert",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Marketing",
      "Other"
    ],
    "tools_software": "Google sheets, docs, Canva, Chat GPT, Helium 10, Keepa, Smart scout.",
    "languages": "English",
    "roles_seeking": "Amazon Brand Manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "120000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e83a96_0a3a429410a3458cb9d5af6dd123be27.pdf"
  },
  {
    "full_name": "Toby Reitzer",
    "email": "reigeld39@gmail.com",
    "phone": "+32 483 33 46 02",
    "whatsapp": "+32 483 33 46 02",
    "location": "Belgium-Antwerp",
    "current_job_title": "Office Administration",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support",
      "Design",
      "Other"
    ],
    "tools_software": "Microsoft Office: Word, Excel, Database-acces, Powerpoint, outlook, google docs,sheets, QuickBooks,",
    "languages": "English, Jiddish, Hebrew, Dutch",
    "roles_seeking": "Data Entry, Sales representative, Customer support, Bookkeeping, Administration, etc",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c944e6_cb53aa6ec6764ec1b3892630196cd050.pdf"
  },
  {
    "full_name": "Jeanine Danilewitz",
    "email": "jeanineblumenau@gmail.com",
    "phone": "+27 73 616 8415",
    "whatsapp": "+27 73 616 8415",
    "location": "Johannesburg, South Africa",
    "current_job_title": "Strategic Analytics and Insights Manager",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education",
      "Tech/Software"
    ],
    "tools_software": "Microsoft Office (Excel, Word, PowerPoint, Outlook); CRM platforms (Salesforce, Brevo); survey and research tools; analytics and reporting tools (BI, SPSS)",
    "languages": "English",
    "roles_seeking": "Research, Customer Insights, Psychometrics",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/bfaeb8_d67d31a14f1c48e7a51d94c7471bd171.pdf"
  },
  {
    "full_name": "Avrohom Pitterman",
    "email": "avromipitterman@gmail.com",
    "phone": "+1 718-954-0761",
    "whatsapp": "+1 718-954-0761",
    "location": "lakewood",
    "current_job_title": "Part time electrical technician",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other:",
      "Tech/Software"
    ],
    "tools_software": "Excel",
    "languages": "English",
    "roles_seeking": "Night jobs",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/6fb3fb_7c8fd57eb9ce477d8364771894ade7d9.txt"
  },
  {
    "full_name": "Roselyn Weisstuch",
    "email": "rweisstuch@yahoo.com",
    "phone": "+972 58-771-3378",
    "whatsapp": "+972 58-771-3378",
    "location": "Jerusalem",
    "current_job_title": "Administrative Assistant, Customer Service",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Word, Excel Outlook",
    "languages": "English",
    "roles_seeking": "Admin assistant, Data Entry, Medical billing, Accounts payable or receivables, payroll",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "22/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/dec047_79c169912c2d431292beeaef91b3a084.pdf"
  },
  {
    "full_name": "Samantha Franklin",
    "email": "samanthaariel96@gmail.com",
    "phone": "+1 732-569-1354",
    "whatsapp": "+1 732-569-1354",
    "location": "Sherman Oaks, USA",
    "current_job_title": "Engagement Coordinator",
    "education_level": "Master's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support"
    ],
    "tools_software": "Slack, iMovie, Canva, Google Drive (docs, sheets, slides), Bandicam, Keap",
    "languages": "English",
    "roles_seeking": "A role in addition to my current job :)",
    "employment_type": [],
    "desired_salary": "20/hour",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8364cc_d1fa1acf92e4429e81ef6a0bc0908ece.pdf"
  },
  {
    "full_name": "Yosef Cohen",
    "email": "yossele33@gmail.com",
    "phone": "+972 52-496-1769",
    "whatsapp": "+44 7472 451399",
    "location": "Jerusalem, Israel",
    "current_job_title": "Student",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Design",
      "Education",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Office, QuickBooks, CapCut, generally tech savvy",
    "languages": "English, Hebrew",
    "roles_seeking": "Administrative, Coordination, Bookkeeping, Video editing, Translation",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b328ba_3f80eab36d0b4982a28774860f77a735.pdf"
  },
  {
    "full_name": "Yishai eagle",
    "email": "yishai.eagle@gmail.com",
    "phone": "+1 410-596-6326",
    "whatsapp": "+1 410-596-6326",
    "location": "Baltimore MD, USA",
    "current_job_title": "N/A",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Design",
      "Education",
      "Other:"
    ],
    "tools_software": "N/a",
    "languages": "English",
    "roles_seeking": "Any",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/836f89_3b98a08d27ab47d0bd76eda72d26003e.pdf"
  },
  {
    "full_name": "Chaim Mevorach",
    "email": "chaimmev@gmail.com",
    "phone": "+1 347-847-1148",
    "whatsapp": "+1 347-847-1148",
    "location": "Lakewood",
    "current_job_title": "Marketing strategist & E-commerce listing specialist",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support",
      "Education",
      "Tech/Software",
      "Other"
    ],
    "tools_software": "Slack, figma, photoshop, word, excel, powerpoint, illustrator, quickbooks, canva, amazon seller central, ebay, shopify,",
    "languages": "English",
    "roles_seeking": "E-commerce, sourcing, manufacturing, tech,",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "100000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4f6268_8dd6ffb64abc44f2adeabd73c8640a29.pdf"
  },
  {
    "full_name": "Tzirel kline",
    "email": "tzirelkline95@gmail.com",
    "phone": "+1 848-261-9789",
    "whatsapp": "+1 848-261-9789",
    "location": "United States",
    "current_job_title": "E-commerce",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Healthcare"
    ],
    "tools_software": "Excel",
    "languages": "English",
    "roles_seeking": "Airbnb customer service",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/add7c4_59af7f08828f4c8eb98b3e2d7b9f2ea4.pdf"
  },
  {
    "full_name": "Ariella macabi",
    "email": "ariellax@hotmail.co.uk",
    "phone": "+972 53-714-9692",
    "whatsapp": "+972 53-714-9692",
    "location": "Israel Tel Aviv",
    "current_job_title": "Office manager",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Design",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Word. Google docs, canva",
    "languages": "English and Hebrew",
    "roles_seeking": "Admin",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "60/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ad7bb2_df894f94480647dfb426264dd8c39c2b.pdf"
  },
  {
    "full_name": "Chani lemberger",
    "email": "hatsedek2@gmail.com",
    "phone": "+32 491 55 78 62",
    "whatsapp": "+32 491 55 78 62",
    "location": "Belgium, Antwerp",
    "current_job_title": "Teacher",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Tech/Software",
      "Design",
      "Customer Support",
      "Marketing"
    ],
    "tools_software": "excell,word,Quickbooks,Powerpointe.",
    "languages": "English,Dutch,yiddish,French",
    "roles_seeking": "bookkeeping, costumerservice, sales,",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/dacc3e_9fb919daf6844247a7e6331bfe7d84ed.pdf"
  },
  {
    "full_name": "Naomie Danan",
    "email": "naomiedan1@gmail.com",
    "phone": "+1 617-599-4747",
    "whatsapp": "+1 617-599-4747",
    "location": "Jerusalem, Israel",
    "current_job_title": "Baker",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Marketing",
      "Other"
    ],
    "tools_software": "PowerPoint, google softwares",
    "languages": "English, French",
    "roles_seeking": "Something in marketing, psychology (I am currently a psychology student), anything including creative such as writing",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c297c3_af6151d5c97f4c019b2f5f7428bdb647.pdf"
  },
  {
    "full_name": "Deborah Penna",
    "email": "debpenna@gmail.com",
    "phone": "+1 347-502-2677",
    "whatsapp": "+44 7426 881124",
    "location": "London",
    "current_job_title": "Global Head of Affiliates & Influencer Marketing",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing"
    ],
    "tools_software": "Slack,Tracking platforms,MS Office, Shopify, Etsy, Canva and more",
    "languages": "English, Italian, French, Dutch, Hebrew",
    "roles_seeking": "Preferably marketing roles, advertising",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "60/hour",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d55cc9_065735feb0d4483ba2f0180c677518bf.pdf"
  },
  {
    "full_name": "Orlie Zak",
    "email": "orliemy@gmail.com",
    "phone": "+972 58-726-0806",
    "whatsapp": "+972 58-726-0806",
    "location": "Jerusalem Israel",
    "current_job_title": "Propert manager",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "CM database management",
    "languages": "English, conversational Hebrew",
    "roles_seeking": "Remote positions, flexible hours",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/fdb051_03b949aeee8e499391c013440d24a09e~mv2.jpeg"
  },
  {
    "full_name": "Rina Miller",
    "email": "rinamiller04@gmail.com",
    "phone": "+972 53-945-7304",
    "whatsapp": "+44 7858 668721",
    "location": "Israel",
    "current_job_title": "Teacher (previous)",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "Microsoft",
    "languages": "Englihs",
    "roles_seeking": "I’m open to different jobs",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/9b9b7f_4617eb3ea3a14b8ca897da6e16871b84~mv2.jpeg"
  },
  {
    "full_name": "Sacha Fogel",
    "email": "moishifogel1@gmail.com",
    "phone": "+32 479 11 49 03",
    "whatsapp": "+32 479 11 49 03",
    "location": "Antwerpen",
    "current_job_title": "Watch seller",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support"
    ],
    "tools_software": "Word",
    "languages": "English,Dutch,French,German",
    "roles_seeking": "Salesmanager/Sales",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "Euro",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/bf1142_8078d1416fdf4bb18b28a0a1e1ecdcbd.pdf"
  },
  {
    "full_name": "Shira Chehanovich",
    "email": "shirachech15@gmail.com",
    "phone": "+972 55-557-9797",
    "whatsapp": "+972 55-557-9797",
    "location": "Bet Shemesh",
    "current_job_title": "Full stack developer",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Customer Support",
      "Education"
    ],
    "tools_software": "Nodejs, react, java, python",
    "languages": "Hebrew, English",
    "roles_seeking": "Development, Tourism, training, teaching",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "130/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/65f9de_fad0045a1e8a46168a3716fd69780554.pdf"
  },
  {
    "full_name": "Toby Reitzer",
    "email": "reigeld@gmail.com",
    "phone": "+32 483 33 46 02",
    "whatsapp": "+32 483 33 46 02",
    "location": "Antwerp Belguim",
    "current_job_title": "Office (secretary)",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other",
      "Design",
      "Tech/Software"
    ],
    "tools_software": "Microsoft office (Excel, Word, Acces etc), QuickBooks, Data Entry,",
    "languages": "English, Dutch, Jiddish, Hebrew",
    "roles_seeking": "Costumer service, Bookkeeping, Administration, Sales,...",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c944e6_bcf3f59724b1485ba646726ce059345a.pdf"
  },
  {
    "full_name": "Joseph Goldstein",
    "email": "josephg1739@gmail.com",
    "phone": "+1 845-603-2138",
    "whatsapp": "+61 425 241 764",
    "location": "Australia",
    "current_job_title": "Handyman in School",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other",
      "Marketing"
    ],
    "tools_software": "N/A",
    "languages": "Yiddish, English",
    "roles_seeking": "Remote job",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "40/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/73377f_7c5ae1df67a14481abfdc8f85367e60b.pdf"
  },
  {
    "full_name": "Laura Sofía conde casallas",
    "email": "sofiaconde389@gmail.com",
    "phone": "+972 52-324-8681",
    "whatsapp": "+972 52-324-8681",
    "location": "Israel -Jerusalem",
    "current_job_title": "Marketing",
    "education_level": "Associate's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Marketing",
      "Design"
    ],
    "tools_software": "Canva",
    "languages": "Spanish, english",
    "roles_seeking": "Marketing digital, community manager, desing",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/00489b_34a481a6c53c4e8e9b8d6ca942b4a969~mv2.png; https://static.wixstatic.com/media/00489b_0f9337fc838948ffb23b2b53e964cc0e~mv2.png"
  },
  {
    "full_name": "Zina Gelman Haratz",
    "email": "gelmanharatz@yahoo.com",
    "phone": "+1 786-260-5478",
    "whatsapp": "+1 786-260-5478",
    "location": "Boca Raton FL",
    "current_job_title": "Dentist",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare"
    ],
    "tools_software": "Dental related",
    "languages": "English and spanish",
    "roles_seeking": "Remote",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "80/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5ee13d_fe43b3ad1bab4c2a8401a8a862d6337d.docx"
  },
  {
    "full_name": "Sarah Rothbart",
    "email": "blimispitzer00@gmail.com",
    "phone": "+972 53-310-2408",
    "whatsapp": "+972 53-310-2408",
    "location": "Jerusalem",
    "current_job_title": "Clinical research data manager",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Healthcare",
      "Other"
    ],
    "tools_software": "slack, microsoft, google, medidata, edc systems",
    "languages": "English, Hebrew, German",
    "roles_seeking": "Open to all",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/85b182_f5f16ee7cd0e49fe82c6c01e94b72f30.pdf"
  },
  {
    "full_name": "Chava-Shoshannah Marcus",
    "email": "chavushm@gmail.com",
    "phone": "+972 58-558-5942",
    "whatsapp": "+972 58-558-5942",
    "location": "Tel Tzion, Israel",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Microsoft Office, Google Workspace, Canva",
    "languages": "English",
    "roles_seeking": "Entry-level, remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50/hour",
    "currency": "NIS",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/245551_796d921efd8d42a8b9717169ccff5559.pdf"
  },
  {
    "full_name": "Mariana Kotler",
    "email": "marianabravot@gmail.com",
    "phone": "+972 54-250-4235",
    "whatsapp": "+972 54-250-4235",
    "location": "Shoham",
    "current_job_title": "Digital Marketing Specialist",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Healthcare"
    ],
    "tools_software": "Slack, Figma, Hubspot, Monday.com, Insightly, Canva, Meta, Google, Tik Tok, etc",
    "languages": "English, Spanish, Hebrew (medium level)",
    "roles_seeking": "Digital marketing roles: hands-on, etc.",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "90/hour",
    "currency": "NIS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f34632_81a71f9a71294b059c2753a88f140984.pdf"
  },
  {
    "full_name": "Devorah Jubiler",
    "email": "devorahj1@gmail.com",
    "phone": "+27 67 691 9785",
    "whatsapp": "+27 67 691 9785",
    "location": "Cape Town, South Africa",
    "current_job_title": "Financial Controller",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "All google programs",
    "languages": "English",
    "roles_seeking": "Any",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/6a8261_9d2775fc0f2141ab8d77a15ecf4bb0b9.pdf"
  },
  {
    "full_name": "Joel Smookler",
    "email": "jsmookler@gmail.com",
    "phone": "+27 82 977 0055",
    "whatsapp": "+27 82 977 0055",
    "location": "Johannesburg",
    "current_job_title": "Unemployed",
    "education_level": "Associate's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Seller cloud, Bria , televantage, windows 11 , Final Cut Pro , Adobe Premiere,  Microsoft  office",
    "languages": "English",
    "roles_seeking": "Any at this point",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "150/hour",
    "currency": "South African Rand",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2cde37_42d1f734d45b48a9b2ff497b08c08b38.pdf"
  },
  {
    "full_name": "shosh",
    "email": "shoshalber@gmail.com",
    "phone": "+972 58-685-0297",
    "whatsapp": "+972 58-685-0297",
    "location": "bet shemesh, Israel",
    "current_job_title": "Amazon Buyer",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Other"
    ],
    "tools_software": "slack, helimn10, keepa, sellersnap",
    "languages": "english",
    "roles_seeking": "amazon",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/eee798_9a1f13c3a0714b4cb018df34d1bd7bf3.pdf"
  },
  {
    "full_name": "Miriam Leebhoff",
    "email": "mleebhoff5@gmail.com",
    "phone": "+1 818-290-4532",
    "whatsapp": "+1 818-290-4532",
    "location": "Bay Harbor Islands USA",
    "current_job_title": "Therapist",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Healthcare"
    ],
    "tools_software": "Excel , dynamics 365, insight GO",
    "languages": "English",
    "roles_seeking": "Remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "60/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/bc6870_fa93f2418c1e4a32a859eb1d9888f47c.pdf"
  },
  {
    "full_name": "Sara Leah Lederman",
    "email": "info@saraleah.com",
    "phone": "+61 401 705 787",
    "whatsapp": "+61 401 705 787",
    "location": "Melbourne, Australia",
    "current_job_title": "Copywriter and magazine writer",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support"
    ],
    "tools_software": "Slack + others, and happy to learn",
    "languages": "English",
    "roles_seeking": "Marketing, writing, administrative",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "40/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d13ffc_2dee55050c214a9292f6539a8f9f3557.pdf"
  },
  {
    "full_name": "Micah Mordechai Teitelbaum",
    "email": "micktei7@gmail.com",
    "phone": "+972 52-567-6425",
    "whatsapp": "+972 52-567-6425",
    "location": "Jerusalem, Israel",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Sales Force, Microsoft Office, Excel",
    "languages": "English, Hebrew",
    "roles_seeking": "Remote Airbnb Guest Support",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "1520/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/3bdf89_12fd6393d77740b2b51843f9245b7361.pdf"
  },
  {
    "full_name": "Sarah",
    "email": "sarahcassius1@gmail.com",
    "phone": "+1 214-394-6118",
    "whatsapp": "+1 214-394-6118",
    "location": "Jerusalem, israel",
    "current_job_title": "N/A",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Healthcare"
    ],
    "tools_software": "Excel, psyquel",
    "languages": "English",
    "roles_seeking": "Nurse, healthcare related jobs",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/bb65a9_3391b6a550b14d959ace68eeb2c8af59.docx"
  },
  {
    "full_name": "Ahuva Spiegel",
    "email": "huvaspiegs@gmail.com",
    "phone": "+1 646-670-0043",
    "whatsapp": "+1 646-670-0043",
    "location": "Dallas TX",
    "current_job_title": "Ecom Management",
    "education_level": "Associate's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Tech/Software",
      "Design",
      "Customer Support"
    ],
    "tools_software": "Please read my resume",
    "languages": "English and Hebrew",
    "roles_seeking": "Ecom Management",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "40/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/371f4a_2fb60bcf797049f7baf8979e73a15da5.pdf"
  },
  {
    "full_name": "Nathan Ustoyev",
    "email": "nustoyev@gmail.com",
    "phone": "+1 646-610-0222",
    "whatsapp": "+1 646-610-0222",
    "location": "United States",
    "current_job_title": "None",
    "education_level": "Master's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Healthcare"
    ],
    "tools_software": "Python",
    "languages": "English and Russian",
    "roles_seeking": "Administrative role",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "22/hour",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/337ca0_4fd1bdcacb734750a9870a8a1cceecd4.pdf"
  },
  {
    "full_name": "Emanuel Cohavi",
    "email": "gamuts-76.tubal@icloud.com",
    "phone": "+1 917-929-9665",
    "whatsapp": "+1 917-929-9665",
    "location": "Kingston PA",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Marketing",
      "Education"
    ],
    "tools_software": "Slack, excel, others",
    "languages": "English, Hebrew, some Spanish",
    "roles_seeking": "Sales, customer service",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/58a038_fddcd20900184bd6adf9364c52e89a04.docx"
  },
  {
    "full_name": "Towa Cohen",
    "email": "tycohn@hotmail.com",
    "phone": "+44 7813 890162",
    "whatsapp": "+44 7813 890162",
    "location": "London",
    "current_job_title": "Director",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Word/excel/AI",
    "languages": "English/German/Hebrew",
    "roles_seeking": "Administrator/Secretarial/head of projrct",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "45/hour",
    "currency": "£",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/0f0509_aa3bde6eeabf468893b330def0e7b739.pdf"
  },
  {
    "full_name": "Eliana Swart",
    "email": "nanaswaart@gmail.com",
    "phone": "+972 52-638-6689",
    "whatsapp": "+1 210-896-1637",
    "location": "Israel",
    "current_job_title": "Graphic Designer / Secretary",
    "education_level": "Associate's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Design",
      "Customer Support"
    ],
    "tools_software": "Slack, Canva, Photoshop, google sheets, Pages, word",
    "languages": "English",
    "roles_seeking": "Remotes roles. Administrative or creative.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/abaa65_51932c59554d4851bbfa52a31737dc25.pdf"
  },
  {
    "full_name": "Shirel Dadoun",
    "email": "shirel.dadoun@gmail.com",
    "phone": "+972 53-720-4796",
    "whatsapp": "+972 53-720-4796",
    "location": "Jerusalem",
    "current_job_title": "Clinical research associate",
    "education_level": "Master's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Healthcare"
    ],
    "tools_software": "Python excel",
    "languages": "Hebrew English French",
    "roles_seeking": "Remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "65/hour",
    "currency": "Shekle",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/557127_6cdd4314c7754cab8007ab54f1b4f461.pdf"
  },
  {
    "full_name": "Elad biton",
    "email": "eladbiton9@gmail.com",
    "phone": "+972 53-888-9909",
    "whatsapp": "+972 53-888-9909",
    "location": "Hadera israel",
    "current_job_title": "E-commerce",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support"
    ],
    "tools_software": "Shopify, Wix, Wordpress",
    "languages": "English, Hebrew",
    "roles_seeking": "Branding, e commerce, digital marketing, sales",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50000/year",
    "currency": "$, ₪",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b50f7d_d413c250435a48c9a773113f49ac4173.pdf"
  },
  {
    "full_name": "Raquel Mae Rein",
    "email": "raquelme@buffalo.edu",
    "phone": "+1 561-350-0716",
    "whatsapp": "+1 561-350-0716",
    "location": "Boca Raton, Florida, United States of America",
    "current_job_title": "Library Director",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Customer Support",
      "Education"
    ],
    "tools_software": "SKILLS • Computer: Excel, Outlook, PowerPoint, Word, HTML and XHTML website from MS publisher,  Adobe Photoshop, Connect, Captivate, Multichannel Order Manager (MOM),eBay Blackthorne,  Auction Lister, and Internet Research • LIS Software: Follett Destiny Library Manager, MARC 21, RDA, digital library projects  (CONTENTdm, OmniUpdate, MODS, OAI, XML, DublinCore, Omeka, and Dspace), OCLC, Sirsi- Dynix, Concord Symphony, Voyager, ILLiad, ALEPH Version 20, Springshare LibGuides, Primo,  Ask A Librarian, Camtasia, and storytelling",
    "languages": "English and Hebrew",
    "roles_seeking": "Any kind of remote role.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "60000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5225d7_23a2ac4146f44e468ab84b9d13b38c0b.pdf"
  },
  {
    "full_name": "Sari Sonnenschine",
    "email": "sarisonnenschine@gmail.com",
    "phone": "+1 917-900-8650",
    "whatsapp": "+1 917-900-8650",
    "location": "Brooklyn",
    "current_job_title": "Social media director",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support"
    ],
    "tools_software": "Slack , canva, Gmail , constant contact",
    "languages": "English",
    "roles_seeking": "Side also at night can do customer service for Airbnb, etc., or social media jobs",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "35/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/03a3a3_77fde62455554e5db2dac6b8179607ec.pdf"
  },
  {
    "full_name": "Batya Spiegel",
    "email": "batyabekhor@gmail.com",
    "phone": "+1 216-212-2086",
    "whatsapp": "+1 216-212-2086",
    "location": "Lakewood USA",
    "current_job_title": "Billing",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare"
    ],
    "tools_software": ".",
    "languages": "English",
    "roles_seeking": "Open to opportunities",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/81d381_24f63119b59f4341acb55fd293d32962.pdf"
  },
  {
    "full_name": "Sol Emunah Richter",
    "email": "solemunahrichter@gmail.com",
    "phone": "+972 53-782-7151",
    "whatsapp": "+1 201-355-6035",
    "location": "Jerusalem",
    "current_job_title": "Medical Scribe",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Healthcare",
      "Education",
      "Customer Support"
    ],
    "tools_software": "Excel, Word, EMRs",
    "languages": "English, Hebrew",
    "roles_seeking": "hopefully medical... if not I am open !",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "22/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/39b714_7ce734757957414a9507bb5cb651116b.docx"
  },
  {
    "full_name": "Yosef Sobol",
    "email": "yysobol@gmail.com",
    "phone": "+1 832-779-2212",
    "whatsapp": "+972 58-428-7702",
    "location": "Houston",
    "current_job_title": "Software Developer",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "React ,JavaScript, TypeScript, Node.js, Laravel, REST APIs, Git, SQL (MySQL/PostgreSQL)",
    "languages": "Hebrew, English",
    "roles_seeking": "Software Engineer / Full-Stack Developer",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "110000/year",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/a0c456_2f19207987b24831b743cd5a1c300940.pdf"
  },
  {
    "full_name": "Dana Admon",
    "email": "danaadmon60@gmail.com",
    "phone": "+972 50-324-1191",
    "whatsapp": "+972 50-324-1191",
    "location": "Tel Aviv",
    "current_job_title": "Customer Support Specialist",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Slack, Contact, Salesforce, teams, Microsoft suite",
    "languages": "English",
    "roles_seeking": "Customer support, customer success,",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "180000/year",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4ae018_415466c5f14f41e7858e20608f52759d.pdf"
  },
  {
    "full_name": "Shaul Asher Krumbein",
    "email": "sakrumbein@gmail.com",
    "phone": "+1 646-612-5885",
    "whatsapp": "+1 646-612-5885",
    "location": "United States",
    "current_job_title": "Sales",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Slack",
    "languages": "English",
    "roles_seeking": "Airbnb virtual assistant",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/98ad7a_eb2705cbc1524b28919047bbba612987.pdf"
  },
  {
    "full_name": "Eitan Koffler",
    "email": "eitankoffler@yahoo.com",
    "phone": "+27 76 569 4328",
    "whatsapp": "+27 76 569 4328",
    "location": "Johannesburg",
    "current_job_title": "Operational Hr Manager",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "Excel, Accpac,  Zoho",
    "languages": "English",
    "roles_seeking": "Operational Management,  Project Management , Hr, Recruitment , Planning , Forecasting",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "0/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b549dc_e2008df885474a4bb6e90e2ffe0412dc.pdf"
  },
  {
    "full_name": "Batel",
    "email": "batelhagbi425@gmail.com",
    "phone": "+1 908-838-1538",
    "whatsapp": "+1 908-838-1538",
    "location": "Hollywood",
    "current_job_title": "Medical",
    "education_level": "Associate's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare",
      "Education"
    ],
    "tools_software": "Excel clinical tech",
    "languages": "English",
    "roles_seeking": "Medical long term",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "800000/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/551e11_27e8b94f8a1f41e493750897e491f5b0.pdf"
  },
  {
    "full_name": "Ben Aaron Michelson",
    "email": "bamichelson64@gmail.com",
    "phone": "+1 415-539-8833",
    "whatsapp": "+1 415-539-8833",
    "location": "New York",
    "current_job_title": "Growth Marketing Analyst",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support"
    ],
    "tools_software": "Salesforce, GA4, Google/Linkedin/Meta Ads manger, Google Sheets, Excel, PowerBI, Heap, RushSEM, Zapier, Tableau, SQL, GPT/Claude, Monday.com, Slack,",
    "languages": "English, Russian, intermediate Spanish and Hebrew",
    "roles_seeking": "Marketing and Analytics",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "35/hour",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e2c225_8a22779c153e460781ac13e1444c2313.pdf"
  },
  {
    "full_name": "Danny Ackerman",
    "email": "danny.ackerman1@outlook.com",
    "phone": "+1 732-688-5842",
    "whatsapp": "+1 732-688-5842",
    "location": "Lakewood, NJ. USA",
    "current_job_title": "Operations manager",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Healthcare"
    ],
    "tools_software": "Brightree, PureCloud",
    "languages": "English",
    "roles_seeking": "Healthcare Operations Management",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "120000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/15fb11_8832328de301463cbc07c2b6ccc6beb4.pdf"
  },
  {
    "full_name": "Rivka Perez",
    "email": "rivkaperez101@gmail.com",
    "phone": "+1 404-644-8312",
    "whatsapp": "+1 404-644-8312",
    "location": "Atlanta",
    "current_job_title": "Student Nurse & Assistant Director",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Healthcare"
    ],
    "tools_software": "EPIC EMR, Google Workspace",
    "languages": "English, Hebrew, French",
    "roles_seeking": "DME specialist specifically but interested in any healthcare related or education roles as well",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/cdd992_cbeca4b7c7034ea195777af65fa073c7.pdf"
  },
  {
    "full_name": "Aharon Halevy",
    "email": "ohalevy@gmail.com",
    "phone": "+972 52-785-1088",
    "whatsapp": "+972 52-785-1088",
    "location": "Bet Shemesh Israel",
    "current_job_title": "Manager, Administrator, Educator",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Word, Excel",
    "languages": "English, Hebrew",
    "roles_seeking": "Customer Service, data entry, back office",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e1318d_a56e596211964526980d85ad18600c0e.doc"
  },
  {
    "full_name": "Mendel Shemtov",
    "email": "mmshmtv@gmail.com",
    "phone": "+1 917-834-4757",
    "whatsapp": "+972 58-566-9302",
    "location": "Jerusalem",
    "current_job_title": "Student",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare",
      "Other"
    ],
    "tools_software": "Quickbook, excel",
    "languages": "English, Hebrew",
    "roles_seeking": "Bookkeeping, open to anything that can fit a part time remote",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/426664_feba38d7676448aca4cca8c3d1e03b1d.pdf"
  },
  {
    "full_name": "Channah Lefkowitz",
    "email": "channahfeiga@gmail.com",
    "phone": "+1 845-799-8898",
    "whatsapp": "+1 845-799-8898",
    "location": "Monsey",
    "current_job_title": "Purchasing Manager",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Healthcare",
      "Other"
    ],
    "tools_software": "Microsoft",
    "languages": "English, Hebrew",
    "roles_seeking": "Administrative",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/553832_680367d274784f4489c5ed673068a97c.docx"
  },
  {
    "full_name": "Rivka Schauder",
    "email": "rivkaschauder@gmail.com",
    "phone": "+44 7942 689048",
    "whatsapp": "+44 7942 686048",
    "location": "Manchester - will be moving to Isreal in April",
    "current_job_title": "Secretary/graphics",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Design",
      "Customer Support",
      "Tech/Software"
    ],
    "tools_software": "Corel, Microsoft, WhatsApp, Gmail etc.",
    "languages": "English",
    "roles_seeking": "Billing, secretarial, office work",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b924c5_c1d66811d9d54aa0988cbe33652631be.pdf; https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b924c5_6513f585d750443eacfe322904869457.docx"
  },
  {
    "full_name": "Odelia Yagudayev",
    "email": "odelianoa1@gmail.com",
    "phone": "+1 347-448-9821",
    "whatsapp": "+1 347-832-1271",
    "location": "Flushing, NY",
    "current_job_title": "Unemployed",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Healthcare",
      "Customer Support"
    ],
    "tools_software": "Excel, word",
    "languages": "English and Spanish",
    "roles_seeking": "Remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b96750_449740819f6947a59d074126781e538e.pdf"
  },
  {
    "full_name": "Netanel Zaurov",
    "email": "nathanzar439@gmail.com",
    "phone": "+1 917-201-0804",
    "whatsapp": "+1 917-201-0804",
    "location": "United States, Cedarhurst",
    "current_job_title": "N/A",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Healthcare",
      "Marketing"
    ],
    "tools_software": "Instagram, google sheets, google docs, etc",
    "languages": "english, hebrew",
    "roles_seeking": "costumer support, email support",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/59dc35_ee5b3f6f95c046d5ba4c369171aefd6a.pdf"
  },
  {
    "full_name": "Chaya Berger",
    "email": "cmberger13@gmail.com",
    "phone": "+1 848-525-8901",
    "whatsapp": "+972 53-474-6608",
    "location": "Lakewood",
    "current_job_title": "Driver and coach",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Healthcare",
      "Other:",
      "Education"
    ],
    "tools_software": "Google, slack, Microsoft",
    "languages": "English & basic Hebrew",
    "roles_seeking": "Remote admin style job",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "35/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e684a9_9d3699f38b5849adad5bd92e82b31fdd.pdf"
  },
  {
    "full_name": "Dina Abrahim",
    "email": "dinaabrahim3@gmail.com",
    "phone": "+1 401-408-0982",
    "whatsapp": "+1 401-408-0982",
    "location": "Berlin, Germany",
    "current_job_title": "Software Developer",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "Java, Spring Boot, Python, SQL, HTML, CSS, JavaScript, Oracle, Cucumber, Jira, Git, Bitbucket, Slack, Excel, Agile, Scrum",
    "languages": "English",
    "roles_seeking": "Project Management",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "80000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/6d3bce_06654322a2bd45a296fa1844dca9a21d.pdf"
  },
  {
    "full_name": "Bailey Werdiger",
    "email": "bailey@werdiger.com",
    "phone": "+61 406 111 457",
    "whatsapp": "+61 406 111 457",
    "location": "Melbourne",
    "current_job_title": "Graphic Designer",
    "education_level": "Associate's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support"
    ],
    "tools_software": "Canva",
    "languages": "English",
    "roles_seeking": "Something that works with my schedule",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "27/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5dffa1_e219f6f9206446c0a9fc129bea294c12.pdf"
  },
  {
    "full_name": "Heather Spiegelman",
    "email": "spiegelmanh18@gmail.com",
    "phone": "+1 484-553-5627",
    "whatsapp": "+1 484-553-5627",
    "location": "Miami fl",
    "current_job_title": "CNA",
    "education_level": "Associate's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Healthcare",
      "Customer Support"
    ],
    "tools_software": "N/a",
    "languages": "English",
    "roles_seeking": "Remote. Customer service healthcare",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/bb5ad3_85857a563e914761a92c1193035435e6.docx"
  },
  {
    "full_name": "Shmuel",
    "email": "liebermanshnulie@gmail.con",
    "phone": "+1 732-569-4243",
    "whatsapp": "+1 732-569-4243",
    "location": "Lakewood",
    "current_job_title": "Logistics Manager",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Slack excell",
    "languages": "English",
    "roles_seeking": "Operations or part Sales",
    "employment_type": [],
    "desired_salary": "170000/year",
    "currency": "Us",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/bd101a_22c173f9768642d4b1d4f9ce0db90b2d.pdf"
  },
  {
    "full_name": "Shira Margalit-Lerner",
    "email": "shiralit7@gmail.com",
    "phone": "+972 50-520-3448",
    "whatsapp": "+972 50-520-3448",
    "location": "Beit Shemesh, Israel",
    "current_job_title": "Analyst",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Microsoft office, google docs, sheets , AI, Canva, Wordpress...",
    "languages": "English, Hebrew, German, Yiddish, Dutch, French",
    "roles_seeking": "Executive assistans, customer service, admin, political adviser...",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50/hour",
    "currency": "NIS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8e8c2f_54b66eeaa7054fc6b110cf47afb16295.pdf"
  },
  {
    "full_name": "Rifky Gluck",
    "email": "rifkigluck@gmail.com",
    "phone": "+44 7384 225929",
    "whatsapp": "+44 7384 225929",
    "location": "United Kingdom",
    "current_job_title": "Administrator at event company",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Monday, excel",
    "languages": "English, Yiddish",
    "roles_seeking": "Remote",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "£/$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/15e127_f541a9b371ef400f8ec2123acca44f12.pdf"
  },
  {
    "full_name": "Joel weissman",
    "email": "weissmanjoel@gmail.com",
    "phone": "+1 347-957-2775",
    "whatsapp": "+1 347-957-2775",
    "location": "Monsey ny",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Basic computer skills",
    "languages": "Yiddish, english",
    "roles_seeking": "Willing to be trained in anything available. I’m a quick lerner",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/88c595_cbc3b9546a6f417db0347697ee3ea9e5.pdf"
  },
  {
    "full_name": "Yehoshua benzaken",
    "email": "yeoshuabz@gmail.com",
    "phone": "+972 50-572-1630",
    "whatsapp": "+972 52-760-1630",
    "location": "Bet shemesh Israel",
    "current_job_title": "Assistant manager warehouse",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Excel",
    "languages": "English Hebrew and understand Spanish and speak some",
    "roles_seeking": "Office",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/340ccb_3be1b2b38c67402aba9d2320487517cc.pdf"
  },
  {
    "full_name": "Usher Diamant",
    "email": "u6629608@gmail.com",
    "phone": "+1 845-662-9608",
    "whatsapp": "+32 496 29 20 64",
    "location": "Antwerpen",
    "current_job_title": "Manager",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other:"
    ],
    "tools_software": "Asana, and more",
    "languages": "English , Yiddish",
    "roles_seeking": "Remote part time",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "€",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9c420f_df3b52f9f8fb46ef9be0553145ff52d7.pdf"
  },
  {
    "full_name": "Rachel Diamant",
    "email": "ccohenrachel@gmail.com",
    "phone": "+1 845-587-2200",
    "whatsapp": "+32 483 99 34 38",
    "location": "Antwerpen, Belgium",
    "current_job_title": "Shop Manger",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other:",
      "Design"
    ],
    "tools_software": "Power point",
    "languages": "English, Flemich, Yiddish",
    "roles_seeking": "I'm good in everything",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "17/hour",
    "currency": "€",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9c420f_94735d9fc81f42bd95b8f3dad8b734b4.pdf"
  },
  {
    "full_name": "Ruchy Rosenberg",
    "email": "ruchy7655@gmail.com",
    "phone": "+1 929-993-7589",
    "whatsapp": "+1 929-993-7589",
    "location": "jerusalem",
    "current_job_title": "unemployed, was school secretary before i moved",
    "education_level": "Associate's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "microsoft word, excel, powerpoint, publisher, canva",
    "languages": "Yiddish, English, french",
    "roles_seeking": "customer service, secretary, billing...flexible.. but remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/30ee43_f8cf9113a7f147409359395ce4d2ce73.pdf"
  },
  {
    "full_name": "Leah Heimann",
    "email": "tekenleah@gmail.com",
    "phone": "+1 917-947-0266",
    "whatsapp": "+32 498 23 30 66",
    "location": "Antwerp, Belgium",
    "current_job_title": "Teacher",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Sketchup, Word, Excel, Powerpoint, Photoshop",
    "languages": "Yiddish, English, Dutch",
    "roles_seeking": "Data Entry, Bookkeeping, Customer support, Personal assistant, E- commerce, Payroll",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/933ce2_75581a1b125d4355ad74f502f47d2745.pdf"
  },
  {
    "full_name": "Nadine Milner",
    "email": "nadinemilner@gmail.com",
    "phone": "+27 82 782 6757",
    "whatsapp": "+27 82 782 6757",
    "location": "JOHANNESBURG",
    "current_job_title": "Administrator",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare",
      "Other"
    ],
    "tools_software": "MS Office system, Google Docs",
    "languages": "English, Afrikaans",
    "roles_seeking": "Administrative,  secretarial, billing , invoicing",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "300/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/afcf88_21b970cbbd0740ebb4e3273cae6c7f1c.pdf"
  },
  {
    "full_name": "frimet katina",
    "email": "kthebest82@gmail.com",
    "phone": "+32 466 14 19 79",
    "whatsapp": "+32 466 14 19 79",
    "location": "Antwerp",
    "current_job_title": "teacher",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "excell, word, powerpoint, quickbooks,",
    "languages": "English , Dutch ,French,Yiddish",
    "roles_seeking": "Secratery, bookkeeping, costumer service",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "14/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/dacc3e_2b9dd63883384893b74465a78a3bfd98.docx"
  },
  {
    "full_name": "Yoel Bodek",
    "email": "edisonsrooms@gmail.com",
    "phone": "+1 929-884-1356",
    "whatsapp": "+1 845-213-0992",
    "location": "Jerusalem, Israel",
    "current_job_title": "Buyer & Customer Service Representative",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "Quickbooks",
    "languages": "Yiddish,",
    "roles_seeking": "Remote office work in administration, purchasing etc.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "40/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f65f90_097665fcec7c4d58bb03b752fe94084f.pdf"
  },
  {
    "full_name": "Herman Gluck",
    "email": "glickart@gmail.com",
    "phone": "+1 917-474-1491",
    "whatsapp": "+1 732-532-2582",
    "location": "Brooklyn",
    "current_job_title": "e-commerce specialist",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Design"
    ],
    "tools_software": "PS AI",
    "languages": "English Yidish",
    "roles_seeking": "Build shopiy or wordpress, websites, list items, scrape, Graphics web Banners",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9681de_c92d89fe95134607a733ab6fef753263.pdf"
  },
  {
    "full_name": "hadassah sasson",
    "email": "hadassahsasson1@gmail.com",
    "phone": "+44 7901 030194",
    "whatsapp": "+44 7901 030194",
    "location": "united kingdom",
    "current_job_title": "web designer",
    "education_level": "Associate's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Education"
    ],
    "tools_software": "figma, photoshop, wordpress, elementor, shopify",
    "languages": "english",
    "roles_seeking": "web design jobs",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "£",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e4ae0f_cfe409f287ce48dcaeade1cdbb56dd68.pdf"
  },
  {
    "full_name": "Mel Ruben",
    "email": "mel_ruben@outlook.com",
    "phone": "+972 55-773-7560",
    "whatsapp": "+972 55-773-7560",
    "location": "Tel Aviv, Israel",
    "current_job_title": "Sales Consultant",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "CRM, Monday.com, Slack, Lucid, Excel",
    "languages": "English",
    "roles_seeking": "Sales, Creative",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "240000/year",
    "currency": "NIS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/964334_7544fc8bf2a04413ab65e501ac078075.pdf"
  },
  {
    "full_name": "Ariel Druck arviv",
    "email": "arviv2307@gmail.com",
    "phone": "+972 54-758-8820",
    "whatsapp": "+972 54-758-8820",
    "location": "Rehovot, israel",
    "current_job_title": "None",
    "education_level": "Associate's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other",
      "Tech/Software",
      "Customer Support"
    ],
    "tools_software": "c, office",
    "languages": "English and hebrew",
    "roles_seeking": "Administration and later on In life cyber security",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/fd88f4_3b9420ace2564bc0ba54fd2c86444d73.docx"
  },
  {
    "full_name": "Michelle Meyerowitz",
    "email": "michelle.meyerowitz@gmail.com",
    "phone": "+27 83 226 0026",
    "whatsapp": "+27 83 226 0026",
    "location": "Johannesburg, South Africa",
    "current_job_title": "Personal Assistant/Administrator",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "MS Office, MS Excel, MS Word, PowerPoint, Outlook, Pastel, Xero",
    "languages": "English",
    "roles_seeking": "Personal Assistant, Administrator",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "220/hour",
    "currency": "ZAR",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/28fa12_f701182f478e43f9a1057c857ea6353c.pdf"
  },
  {
    "full_name": "Eli Herskovits",
    "email": "eliteny0@gmail.com",
    "phone": "+1 212-365-0812",
    "whatsapp": "+1 212-365-0812",
    "location": "Brooklyn",
    "current_job_title": "Graphic designer, Web developer",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Design",
      "Marketing"
    ],
    "tools_software": "JavaScript, Figma, vue, slack",
    "languages": "English, Yiddish",
    "roles_seeking": "frontend web developer",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f03006_fa490d3ec8fc4abf983d1069df97e459.pdf"
  },
  {
    "full_name": "Leah Goldberger",
    "email": "clbxcmc@gmail.com",
    "phone": "+1 845-781-3682",
    "whatsapp": "+1 845-781-3682",
    "location": "Jerusalem, Israel",
    "current_job_title": "Secretary",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Healthcare"
    ],
    "tools_software": "Microsoft",
    "languages": "English, Yiddish",
    "roles_seeking": "Client/business relations",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1ac227_694f45709b8a4dbb9f66db6fbf3b8299.pdf"
  },
  {
    "full_name": "pinchas",
    "email": "pinchs213@gmail.com",
    "phone": "+32 483 33 47 18",
    "whatsapp": "+32 483 33 47 18",
    "location": "antwerpen,belgie",
    "current_job_title": "warehouse",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education"
    ],
    "tools_software": "word",
    "languages": "hibrew,yddish",
    "roles_seeking": "Working from home on a computer",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "17/hour",
    "currency": "euro",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/a02489_75886efbfece41a78c4bf98fa8987bc0.docx"
  },
  {
    "full_name": "Gershon Weinberg",
    "email": "gwein2002@gmail.com",
    "phone": "+972 50-892-5377",
    "whatsapp": "+972 50-892-5377",
    "location": "Efrat, israel",
    "current_job_title": "Sales agent",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Other",
      "Tech/Software",
      "Customer Support",
      "Education"
    ],
    "tools_software": "Office, Hubspot,Excel",
    "languages": "English,Hebrew",
    "roles_seeking": "Sales or customer support",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/0f95e0_5ea00b5d00e24f6ea542b8f19b1b3c2d~mv2.jpg"
  },
  {
    "full_name": "Elisheva Markovic",
    "email": "eli7dick@gmail.com",
    "phone": "+1 848-226-9316",
    "whatsapp": "+1 732-660-8101",
    "location": "Lakewood",
    "current_job_title": "Educator",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Design",
      "Education",
      "Tech/Software"
    ],
    "tools_software": "Slack, Canva, Adobe Photoshop, Adobe Illustrator, Adobe InDesign, Microsoft Word, Microsoft Publisher, Microsoft PowerPoint, Clip Studio Paint",
    "languages": "English",
    "roles_seeking": "Marketing Assistant",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "26/hour",
    "currency": "$",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/435a6b_cba4e0d32d2245e8bc016f9f88f209de.pdf"
  },
  {
    "full_name": "Dorine aharonov",
    "email": "dorineh785@yahoo.com",
    "phone": "+972 52-266-0815",
    "whatsapp": "+972 52-266-0815",
    "location": "Jerusalem israel",
    "current_job_title": "Amazon sales",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Healthcare",
      "Marketing"
    ],
    "tools_software": "Slack",
    "languages": "English Hebrew",
    "roles_seeking": "Customer service , Amazon sales",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "18/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/62f6d1_3fb73a191c394e02a124f82a1840b6a6.pdf"
  },
  {
    "full_name": "Shevy",
    "email": "6794sg@gmail.com",
    "phone": "+1 929-271-6794",
    "whatsapp": "+1 929-271-6794",
    "location": "Brooklyn, NY",
    "current_job_title": "Administrative Assistant",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Other"
    ],
    "tools_software": "Quickbooks, YSL/Quickbase, Microsoft, Clickup, Docusign, PandaDoc",
    "languages": "Yiddish, English",
    "roles_seeking": "Bookkeeping",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "35/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1404f7_261426608c774784aed8c45eafb2302d.pdf"
  },
  {
    "full_name": "Sholom Block",
    "email": "sholomb527@gmail.com",
    "phone": "+1 908-246-0692",
    "whatsapp": "+1 908-246-0692",
    "location": "Westfield",
    "current_job_title": "Unemployed",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "Docs, Word,",
    "languages": "English",
    "roles_seeking": "Customer support",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8c8f41_25bcc3e8a5b449a7ac62c6e60abc2f12.pdf"
  },
  {
    "full_name": "Shirelle sacks",
    "email": "shirellemory92@gmail.com",
    "phone": "+972 53-782-1944",
    "whatsapp": "+1 585-478-9474",
    "location": "Israel",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Google docs",
    "languages": "English, Hebrew",
    "roles_seeking": "Online sales , salary based entry levek",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50/hour",
    "currency": "Nis",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7bfdca_a48f301bbde946a892f12f3398c6e77d.pdf"
  },
  {
    "full_name": "Hindy Staiman",
    "email": "hindyst321@gmail.com",
    "phone": "+972 58-321-3916",
    "whatsapp": "+972 58-321-3916",
    "location": "Jerusalem,Israel",
    "current_job_title": "Between jobs",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Design",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Excel and Microsoft office",
    "languages": "English,Hebrew,basic Russian",
    "roles_seeking": "Customer support or data base",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/02b357_0484ce1ce8e44039845da5db1c60d130.pdf"
  },
  {
    "full_name": "Ariella Strydom",
    "email": "ariella.riva.teres@gmail.com",
    "phone": "+972 54-736-6051",
    "whatsapp": "+27 82 780 2623",
    "location": "Netanya, Israel",
    "current_job_title": "Bookkeeper",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Microsoft Office, Xero, Sage",
    "languages": "English",
    "roles_seeking": "Bookkeeping, Account Management",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/64e0c8_f0d0912d979c47b29586d9d317770caa~mv2.jpg"
  },
  {
    "full_name": "Rachel Teller",
    "email": "rachelteller13@gmail.com",
    "phone": "+1 845-323-3888",
    "whatsapp": "+1 845-323-3888",
    "location": "United States, new york",
    "current_job_title": "PCA coordinator in Hamaspik Home Care",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare"
    ],
    "tools_software": "Excel, word.",
    "languages": "English",
    "roles_seeking": "Coordination, Problem solving, data entry.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8a38ab_8f915a03bcf34030ab0b63fd15fb75d6.pdf"
  },
  {
    "full_name": "Devorah Flinkenstein",
    "email": "dleah011@gmail.com",
    "phone": "+1 516-607-0011",
    "whatsapp": "+1 516-607-0011",
    "location": "Pomona, NY",
    "current_job_title": "Software Developer",
    "education_level": "Master's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Education"
    ],
    "tools_software": "Slack, Java, Git Extensions, SQL, Jira (check out my Linked In for more skills!)",
    "languages": "English",
    "roles_seeking": "Software Developer. Also open to a job in which great communication and orgnational skills and time management etc come in handy, such as Product Manager",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "100000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/76f6f1_7508033a29c645459da41d096c4d8945.docx"
  },
  {
    "full_name": "batyah friedman",
    "email": "batyahfriedman@gmail.com",
    "phone": "+1 347-587-9799",
    "whatsapp": "+1 347-587-9799",
    "location": "POMONA",
    "current_job_title": "HR Director",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare",
      "Education"
    ],
    "tools_software": "Excelforce,",
    "languages": "English,  Spanish",
    "roles_seeking": "Anything in the HR field",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "40/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/18f8c1_093a1aec20dd4487a9d0adc19c23cc8c.pdf"
  },
  {
    "full_name": "Danny Levy",
    "email": "chocolatelevy@gmail.com",
    "phone": "+1 617-395-7672",
    "whatsapp": "+972 50-887-7313",
    "location": "Jerusalem",
    "current_job_title": "Sales",
    "education_level": "Master's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Customer Support"
    ],
    "tools_software": "SalesForce, Hubspot",
    "languages": "English, Hebrew",
    "roles_seeking": "Sales, Marketing",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "22/hour",
    "currency": "U.S. $",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e5667d_39bdcc28b38648e0bfe181766f535750.pdf"
  },
  {
    "full_name": "Gavin Samuels",
    "email": "samuels.gavin@ymail.com",
    "phone": "+27 72 172 2188",
    "whatsapp": "+27 72 172 2188",
    "location": "Johannesburg, South Africa",
    "current_job_title": "Accountant",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare",
      "Other"
    ],
    "tools_software": "Sage Pastel, Excel, Word, Sage Intacct",
    "languages": "English",
    "roles_seeking": "Accountant, Senior Bookkeeper",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "480000/year",
    "currency": "Rand",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2288b1_9601dc29d872425c97679d9a3f752bef.doc"
  },
  {
    "full_name": "Jaime Mizrahi",
    "email": "jaime.mibero@gmail.com",
    "phone": "+52 55 3020 9778",
    "whatsapp": "+52 55 3020 9778",
    "location": "Mexico City",
    "current_job_title": "CEO",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "Jira, Microsoft Project, Scrum, Python, JavaScript, SQL, React, AWS, Docker, Excel Avanzado, Power BI, Salesforce, SAP, APIs REST, Notion, Miro, Figma",
    "languages": "English, Spanish",
    "roles_seeking": "Project manager, product owner",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1e8094_3003cf6029674409be1b1ecf4351410f.pdf"
  },
  {
    "full_name": "(evelyn lunczer) Chavi Assaf",
    "email": "lunczerchavi@gmail.com",
    "phone": "+1 929-619-0331",
    "whatsapp": "+1 732-299-8726",
    "location": "Lakewood",
    "current_job_title": "Education, research, writing",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare",
      "Education",
      "Customer Support",
      "Marketing"
    ],
    "tools_software": "Word, Excel, Powerpoint, CentralReach, Rethink",
    "languages": "English, Yiddish",
    "roles_seeking": "remote",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/919643_2932c3d46fa241a2a124d30e16253d6d.docx"
  },
  {
    "full_name": "Moishe Hillel Spira",
    "email": "spira4715@gmail.com",
    "phone": "+44 7798 944715",
    "whatsapp": "+972 55-335-8174",
    "location": "בית שמש",
    "current_job_title": "manage charity organisation",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "quickbooks",
    "languages": "yiddish and basic english",
    "roles_seeking": "bookkeeping or managing accounts are costemer support",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ca3489_c30752620ce5420daf67f56229f33a75.docx"
  },
  {
    "full_name": "Chaya Sury Lowy",
    "email": "lowyap@gmail.com",
    "phone": "+1 718-302-1977",
    "whatsapp": "+1 347-409-8185",
    "location": "Brooklyn",
    "current_job_title": "student",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "Microsoft",
    "languages": "English, Yiddish",
    "roles_seeking": "Quickbooks",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4e3b6f_ef9c664b1a9448dea54c1bb2f6b2beaa.pdf"
  },
  {
    "full_name": "Michael gutmann",
    "email": "mgutmann811@gmail.com",
    "phone": "+972 58-744-7436",
    "whatsapp": "+972 58-744-7436",
    "location": "Jerusalem",
    "current_job_title": "Sales man",
    "education_level": "Master's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Healthcare",
      "Other"
    ],
    "tools_software": "Slack,Salesforce, Hubspot",
    "languages": "German,French, English, Hebrew, Yiddish",
    "roles_seeking": "Sales, Customer Relationships, etc.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "300000/year",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f76109_0088741083aa45cca04aa87954b8f73a.pdf"
  },
  {
    "full_name": "David Bouchard",
    "email": "davebouchard740@yahoo.com",
    "phone": "+972 52-235-8590",
    "whatsapp": "+972 52-235-8590",
    "location": "Tel Aviv",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support"
    ],
    "tools_software": "Office 365",
    "languages": "English",
    "roles_seeking": "Customer support",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50/hour",
    "currency": "NIS",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/188d63_31d33e7a31334408bec8b92872c7e00e.pdf"
  },
  {
    "full_name": "Brina Szklarz",
    "email": "brynaszklarz4@gmail.com",
    "phone": "+1 347-393-6094",
    "whatsapp": "+1 347-393-6094",
    "location": "Ststen island",
    "current_job_title": "Photographer  /sales/ swim instructor",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Design",
      "Education",
      "Other"
    ],
    "tools_software": "Quick books",
    "languages": "English yiddush",
    "roles_seeking": "Not sure",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "45/hour",
    "currency": "USA",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/05d3f2_2e80c2307ef249e880707250f893b0ff~mv2.jpeg"
  },
  {
    "full_name": "Levi Schechter",
    "email": "levi.schechter@gmail.com",
    "phone": "+1 347-248-8445",
    "whatsapp": "+1 347-248-8445",
    "location": "Phoenix, AZ, USA",
    "current_job_title": "Unemployed. Before that was financial controller.",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "QuickBooks, Excel, Xero",
    "languages": "English, Yiddish",
    "roles_seeking": "Back office banking, all financial controller areas, operations, accounting style job (any not needing an accounting degree), bookkeeping etc",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "75000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/16ad13_4ee712018cb84f02bac00198fc0f296b.pdf"
  },
  {
    "full_name": "Chaya Niasoff",
    "email": "cniasoff@gmail.com",
    "phone": "+1 917-975-9438",
    "whatsapp": "+1 917-975-9438",
    "location": "NY",
    "current_job_title": "self employed",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Design",
      "Education",
      "Other"
    ],
    "tools_software": "Sketchup,Autocad,3D max, photoshop,excel,",
    "languages": "English, understand and can speak Hebrew, Yiddish",
    "roles_seeking": "Dept. head, project manager, willing to break into an environment in the design field",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "130000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/a975fe_3ee94bdf3cdc45c896cbae8f254824c1~mv2.jpeg"
  },
  {
    "full_name": "Shimon Butbul",
    "email": "shimon.butbul19@gmail.com",
    "phone": "+1 917-379-5541",
    "whatsapp": "+1 917-379-5541",
    "location": "Brooklyn ny",
    "current_job_title": "Sela manager retail store",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other:"
    ],
    "tools_software": "not so good with software",
    "languages": "English and Hebrew",
    "roles_seeking": "Clotting, managers, store, retail store",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "80000/year",
    "currency": null,
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/35da46_88860c95a236414096412d3031d3c5f1.docx"
  },
  {
    "full_name": "Ezra Dweck",
    "email": "ezdweck32@gmail.com",
    "phone": "+1 917-525-7198",
    "whatsapp": "+1 917-525-7198",
    "location": "Brooklyn",
    "current_job_title": "Unemployed",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Other"
    ],
    "tools_software": "Excel, Powerpoint, Graphic Design, Video Editing",
    "languages": "English and Hebrew",
    "roles_seeking": "Sales/marketing/logistics in consumer packaged goods",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "75000/year",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/768264_d195c90b7e3b4dc5b916f277668b159a.pdf"
  },
  {
    "full_name": "David Apperman",
    "email": "david@abasixco.com",
    "phone": "+1 917-599-3951",
    "whatsapp": "+1 917-599-3951",
    "location": "Lawrence NY USA",
    "current_job_title": "CFO/ COO",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Excel, Quickbooks",
    "languages": "English , Yiddish",
    "roles_seeking": "CFO",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "130/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7b0a2e_027496897e4d4c95a8370f3bfd1779e9.docx"
  },
  {
    "full_name": "Shoshana Meir",
    "email": "shanirosemeir@gmail.com",
    "phone": "+972 53-398-6777",
    "whatsapp": "+972 53-398-6777",
    "location": "Jerusalem, Israel",
    "current_job_title": "Student",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Basic office",
    "languages": "English and Hebrew",
    "roles_seeking": "Customer Service, Personal Assistant",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "70/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/646e97_f770e88f95764d42a43562b4cd3192b2.pdf"
  },
  {
    "full_name": "Donial Rosenfeld",
    "email": "statenisland89@gmail.com",
    "phone": "+1 718-938-1449",
    "whatsapp": "+1 718-938-1449",
    "location": "Staten Island",
    "current_job_title": "Healthcare Consultant",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare",
      "Marketing"
    ],
    "tools_software": "Microsoft",
    "languages": "English, Hebrew",
    "roles_seeking": "Healthcare Operations/Management",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "135000/year",
    "currency": "USF",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b17a4f_539f91496c9647769f563ca5a56e768d.pdf"
  },
  {
    "full_name": "Yechiel  Exler",
    "email": "yexler@outlook.com",
    "phone": "+1 929-539-2773",
    "whatsapp": "+1 929-539-2773",
    "location": "Brooklyn, USA",
    "current_job_title": "Na",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Healthcare",
      "Other"
    ],
    "tools_software": "Excel, word, profit stars, visual",
    "languages": "English, Hebrew",
    "roles_seeking": "Full charge bookkeeper, assistant controller, controller",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "45/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ec73a0_eb3a4ca7058f4571846a7fd860f7036a.pdf"
  },
  {
    "full_name": "Sia Rofeim",
    "email": "siarofeim@gmail.com",
    "phone": "+1 917-981-0965",
    "whatsapp": "+1 917-981-0965",
    "location": "Great Neck",
    "current_job_title": "Accountant",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other:"
    ],
    "tools_software": "Quick books",
    "languages": "English, Persian",
    "roles_seeking": "Book keeping, Accounting, Management",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "75000/year",
    "currency": "$",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5019ff_a7a8e6a8ce4244d5a9045a875a22b13f.pdf"
  },
  {
    "full_name": "David Leifer",
    "email": "leiferdavid@yahoo.com",
    "phone": "+1 347-743-3444",
    "whatsapp": "+1 347-743-3444",
    "location": "Suffern",
    "current_job_title": "COO",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other:"
    ],
    "tools_software": "Microsoft, QB.",
    "languages": "English, Yiddish",
    "roles_seeking": "Leadership: Managing, Executive, Operations",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "150000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2ae47e_54b338a7f2e541caabc600bd27090795.pdf"
  },
  {
    "full_name": "jacob tourjman",
    "email": "jacobtourjman@gmail.com",
    "phone": "+1 917-968-0454",
    "whatsapp": "+1 917-968-0454",
    "location": "Brooklyn, USA",
    "current_job_title": "Ecommerce / website / marketplace operator",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Marketing",
      "Other"
    ],
    "tools_software": "MS OFFICE, ADOBE PHOTOSHOP, COREL DRAW",
    "languages": "ENGLISH, HEBREW",
    "roles_seeking": "SALES / TECH",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/a7ac2f_69b92e081fc34b55be336207685112a8.docx"
  },
  {
    "full_name": "Refoel Rothschild",
    "email": "bilanzklar@gmail.com",
    "phone": "+32 483 51 08 20",
    "whatsapp": "+32 487 32 54 71",
    "location": "Antwerp",
    "current_job_title": "Bookkeeper",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Excel, various bookkeeping software",
    "languages": "English, German, Hebrew, Yiddish",
    "roles_seeking": "E-commerce or PA/Bookkeeping",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "18/hour",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/240113_7266c740360f4fcf9621e7e35eda256d.docx"
  },
  {
    "full_name": "Ezra Zanger",
    "email": "ezzanger@gmail.com",
    "phone": "+972 58-560-4377",
    "whatsapp": "+972 58-560-4377",
    "location": "Jerusalem, Israel",
    "current_job_title": "Data Engineer",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "Python SQL Power BI",
    "languages": "English, Hebrew",
    "roles_seeking": "Data Analyst, Data Engineer",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "110000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/610051_2b870afe332c422cb6b08976bd2a4ab9.pdf"
  },
  {
    "full_name": "Geulah ezagui",
    "email": "geulahz99@gmail.com",
    "phone": "+1 561-383-0469",
    "whatsapp": "+972 53-924-5521",
    "location": "Israel",
    "current_job_title": "Student",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Design"
    ],
    "tools_software": "QuickBooks, crm",
    "languages": "English, Hebrew",
    "roles_seeking": "Sales, marketing, assistance",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2af4a7_da91eec2ef0047b0ab4378eef242d9ac.pdf"
  },
  {
    "full_name": "Devorelle Lubelsky",
    "email": "devorellelubelsky@gmail.com",
    "phone": "+32 491 55 57 21",
    "whatsapp": "+32 491 55 57 21",
    "location": "belgium",
    "current_job_title": "administrator, Secretary",
    "education_level": "Associate's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "Microsoft, Data Entry",
    "languages": "English",
    "roles_seeking": "Administrator , Sales Assistant, administrative support",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "15/hour",
    "currency": "Euro",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/177291_a50a7b213d174b2abf73a1be04191c14.pdf"
  },
  {
    "full_name": "Debbie Gidish",
    "email": "debbiegidish@icloud.com",
    "phone": "+27 84 428 8845",
    "whatsapp": "+27 84 428 8845",
    "location": "Johannesburg South Africa",
    "current_job_title": "Self employes",
    "education_level": "Associate's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Microsoft , pastel",
    "languages": "English , Afrikaans",
    "roles_seeking": "Online sales or customer support",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "13/hour",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5cc90d_1e89c57451974930863e4d9ae94b3a2e.pdf"
  },
  {
    "full_name": "Daniel Goldberg",
    "email": "dannygoldb@hotmail.com",
    "phone": "+32 489 06 89 90",
    "whatsapp": "+32 489 06 89 90",
    "location": "Antwerpen",
    "current_job_title": "Unemployed",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Marketing",
      "Customer Support"
    ],
    "tools_software": "Excel",
    "languages": "Dutch Yiddish, English, French ,Hebrew",
    "roles_seeking": "Office work",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "15/hour",
    "currency": "Euro",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/070b74_a0b54499f5e34b8aa18a851732681c8f.pdf"
  },
  {
    "full_name": "Kreindy Flam",
    "email": "flamkreindy@gmail.com",
    "phone": "+1 845-376-0335",
    "whatsapp": "+1 845-376-0335",
    "location": "jerusalem, Israel",
    "current_job_title": "Bookkeeper",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Quickbooks",
    "languages": "English, Yiddish",
    "roles_seeking": "Bookeeping",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "0",
    "currency": null,
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d18540_53c7e050d6d9448aa29a912d78d0ef7f.pdf"
  },
  {
    "full_name": "Surala Piller",
    "email": "suralamarko@gmail.com",
    "phone": "+972 53-316-2128",
    "whatsapp": "+972 53-395-5727",
    "location": "Jerusalem israel",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support"
    ],
    "tools_software": "Excel, mail chimp, website updates",
    "languages": "English",
    "roles_seeking": "Open to options",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ec942d_bbd42eddcbfb4eca941488c45569512e.pdf"
  },
  {
    "full_name": "Malky Greenfeld",
    "email": "malkygreenfeld0884@gmail.com",
    "phone": "+1 347-791-0884",
    "whatsapp": "+1 347-791-0884",
    "location": "Williamsburg",
    "current_job_title": "Secretary",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "All basics, basic excel, basic quickbooks.",
    "languages": "Yiddish and english",
    "roles_seeking": "Various",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/6a2d8d_d34ff7ac853d47daa3d7096ee44b0f82~mv2.jpg"
  },
  {
    "full_name": "Chaya Birnbaum",
    "email": "chayabnoe@gmail.com",
    "phone": "+1 646-927-9219",
    "whatsapp": "+1 646-927-9219",
    "location": "Brooklyn NY",
    "current_job_title": "Amazon consultant, customer service, listing organization",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Tech/Software",
      "Education"
    ],
    "tools_software": "slack and much more",
    "languages": "English Yiddish",
    "roles_seeking": "customer service or anything motivational",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50/hour",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d69bde_6bb7be0d70e1478e8a4e762a4763cf2c.docx"
  },
  {
    "full_name": "Libby Rosenthal",
    "email": "libbyneustein7964@gmail.com",
    "phone": "+1 347-461-8780",
    "whatsapp": "+1 347-461-8780",
    "location": "Brooklyn NY",
    "current_job_title": "Tutor",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "NA",
    "languages": "English Yiddish",
    "roles_seeking": "secretary work, basic data entry, customer service, etc. preferably no internet",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "35/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/3d300d_33d12120a3534a119a893f76e4c83c4f.odt"
  },
  {
    "full_name": "Charnie Waldman",
    "email": "charnie7861@gmail.com",
    "phone": "+1 845-500-8208",
    "whatsapp": "+1 845-604-1125",
    "location": "Monroe",
    "current_job_title": "Prevention coordinator",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Healthcare",
      "Other"
    ],
    "tools_software": "Seller cloud, ECW, QB online",
    "languages": "Yiddish, English",
    "roles_seeking": "Secretary, customer service..",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "American",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/48c146_8ffdc791824a45a6bb681472f3060f29.pdf"
  },
  {
    "full_name": "Sheindel Leibovitz",
    "email": "sheindelr@yahoo.com",
    "phone": "+1 917-279-5105",
    "whatsapp": "+1 929-675-4771",
    "location": "Brookyln",
    "current_job_title": "Not employed",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Quickbooks, microsoft",
    "languages": "English, yiddish",
    "roles_seeking": "Customer service/data entry",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "16/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/33d8fa_d58d244667184f4dbdcf7f75fdf1abab.doc"
  },
  {
    "full_name": "Chani Bistritzky",
    "email": "chanibistritzky@gmail.com",
    "phone": "+1 929-997-2554",
    "whatsapp": "+1 929-997-2554",
    "location": "Israel",
    "current_job_title": "N/A",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [],
    "tools_software": "Computers.",
    "languages": "English, yiddish",
    "roles_seeking": "administration, sales",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "35000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b746b9_fe2088aa0dab4c388250bca2b7689bd3.pdf"
  },
  {
    "full_name": "Elky klein",
    "email": "elkyk436@gmail.com",
    "phone": "+1 347-436-5512",
    "whatsapp": "+1 516-988-3767",
    "location": "Brooklyn ny",
    "current_job_title": "Turf office",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Design"
    ],
    "tools_software": "Slack",
    "languages": "English, yiddish",
    "roles_seeking": "Design, customer service...",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/b8a7ee_4c9137ea126c400398cf27bdf25ef8e4~mv2.jpg"
  },
  {
    "full_name": "Esther Rosenberg",
    "email": "estherlowin@gmail.com",
    "phone": "+1 929-287-1673",
    "whatsapp": "+1 929-287-1673",
    "location": "Williamsburg",
    "current_job_title": "typing simple graphics",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Design",
      "Other"
    ],
    "tools_software": "Photoshop & Word",
    "languages": "English/Yiddish",
    "roles_seeking": "NOT QUICKBOOKS/EXCEL AS WELL AS NO COMMUNICTION INVOLVED",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/8229e4_e866c32988b34a8396bf30f03616dea5~mv2.png"
  },
  {
    "full_name": "Idy Goldberger",
    "email": "idybrach14@gmail.com",
    "phone": "+1 347-200-7594",
    "whatsapp": "+1 347-200-7594",
    "location": "Israel",
    "current_job_title": "Im open to anything",
    "education_level": "Master's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "Billing",
    "languages": "Yiddish & English",
    "roles_seeking": "Open to anything",
    "employment_type": [],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2cfd5e_67c3c5a8dee74b1394a89f70d9aaa2c5.docx"
  },
  {
    "full_name": "Ruchel fleischman",
    "email": "kleinmanruchy@gmail.com",
    "phone": "+1 347-388-3891",
    "whatsapp": "+1 347-388-3891",
    "location": "Brooklyn",
    "current_job_title": "Real estate management",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Rent Manager",
    "languages": "English, Yiddish",
    "roles_seeking": "Flexible hours when available, part time with room to grow",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/3228a4_291979db4934416eaea2c4b2acf6d160~mv2.jpg"
  },
  {
    "full_name": "Rosie Leifer",
    "email": "rosieleifer@gmail.com",
    "phone": "+1 718-309-3607",
    "whatsapp": "+27 79 293 1874",
    "location": "Israel",
    "current_job_title": "Madricha",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Customer Support"
    ],
    "tools_software": "Microsoft Suite + I'm a quick learner",
    "languages": "English, Yiddish",
    "roles_seeking": "Manager",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/863daa_ce6422f276c749aabcf83b38eaf920af.pdf"
  },
  {
    "full_name": "Michelle Jarboe",
    "email": "michelleljarboe@gmail.com",
    "phone": "+1 725-252-5024",
    "whatsapp": "+1 725-252-5024",
    "location": "Wimauma, Florida, USA",
    "current_job_title": "Looking for work",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education",
      "Healthcare",
      "Other",
      "managing teams"
    ],
    "tools_software": "Slack, Microsoft Office, Google Workspace, EHR",
    "languages": "English",
    "roles_seeking": "Customer support, data entry, executive or personal assistant, healthcare, project manager, sales representative",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e1370a_20d55424cb0a4fa283ddb54471670b1a.pdf"
  },
  {
    "full_name": "Chaim Weingarten",
    "email": "weingartenchaim9@gmail.com",
    "phone": "+972 53-342-9433",
    "whatsapp": "+972 53-342-9433",
    "location": "Jerusalem",
    "current_job_title": "Just finished Yeshiva",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Design",
      "Customer Support",
      "Other:"
    ],
    "tools_software": "No formal proficiency yet, eager to learn",
    "languages": "English",
    "roles_seeking": "Customer Assistance",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/c2a347_ddf9645e8daf49bb9da23be32f04ba36~mv2.jpg"
  },
  {
    "full_name": "mari bukia",
    "email": "mbukia175@gmail.com",
    "phone": "+972 50-794-1091",
    "whatsapp": "+972 50-794-1091",
    "location": "tel aviv",
    "current_job_title": "sales representative",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other:"
    ],
    "tools_software": "crm",
    "languages": "english, georgian",
    "roles_seeking": "sales",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/0ffbfc_3249be83e1664eff92add43c8e9703ec.pdf"
  },
  {
    "full_name": "Shimon Hermon",
    "email": "shimonharherman@gmail.com",
    "phone": "+1 305-306-9406",
    "whatsapp": "+972 53-484-9320",
    "location": "Miami, Florida, USA / Efrat, IL",
    "current_job_title": "Tech Recruiter",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software",
      "Education",
      "Marketing"
    ],
    "tools_software": "Various ATS/CRM Softwares, AI Suite Tools, and LinkedIn Recruiter",
    "languages": "English, Spanish, Hebrew",
    "roles_seeking": "Recruitment/Sales Positions, Open to Orhers",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/95bf14_0596a27bca22440b94197d9048bef917.pdf"
  },
  {
    "full_name": "Jarrit Rose",
    "email": "trifox01@gmail.com",
    "phone": "+27 65 350 5699",
    "whatsapp": "+27 65 350 5699",
    "location": "Johannesburg 2190",
    "current_job_title": "Manager cleaning company",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing"
    ],
    "tools_software": "Word, excel",
    "languages": "English",
    "roles_seeking": "Personal assistant",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/7545fb_e61951bfc2d4499f986a74d3cf0a4c27~mv2.jpg"
  },
  {
    "full_name": "Aviva Miller",
    "email": "avivakabillio@gmail.com",
    "phone": "+972 54-398-7362",
    "whatsapp": "+972 54-398-7362",
    "location": "Bet Horon, Israel",
    "current_job_title": "Freelance Graphic Designer",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Design",
      "Education",
      "Marketing"
    ],
    "tools_software": "Illustrator, Figma, Rhino 3D, and Photoshop",
    "languages": "English and Hebrew",
    "roles_seeking": "Everything",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "85/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9f8881_d323c77cf38b45829f7c1d3afba1b64f.pdf"
  },
  {
    "full_name": "Janine Blackman-Katsch",
    "email": "janineblackman@gmail.com",
    "phone": "+44 7763 387907",
    "whatsapp": "+44 7763 387907",
    "location": "London",
    "current_job_title": "Homemaker",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Marketing",
      "Healthcare",
      "Other"
    ],
    "tools_software": "MS Office & Visio. I'm a very quick learner of any company's software.",
    "languages": "English",
    "roles_seeking": "Remote customer service or remote assistant",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7ad22e_41b2715c615f406f95b88189bfd54468.pdf"
  },
  {
    "full_name": "Joel Guevara",
    "email": "guevarapazjoel14@gmail.com",
    "phone": "+593 99 266 9633",
    "whatsapp": "+593 99 266 9633",
    "location": "Ecuador",
    "current_job_title": "Manger",
    "education_level": "Master's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Marketing",
      "Design",
      "Education"
    ],
    "tools_software": "Power BI, SPSS, Canva",
    "languages": "English, Spanish and French",
    "roles_seeking": "Supervisor, manager",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2e4c84_1733cfc12629468b9e2cf5291ddb9279.pdf"
  },
  {
    "full_name": "Esther Fromowitz",
    "email": "elffromo@gmail.com",
    "phone": "+1 845-587-6712",
    "whatsapp": "+1 845-587-6712",
    "location": "Airmont",
    "current_job_title": "Office manager",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Other"
    ],
    "tools_software": "QuickBooks, Microsoft office, adobe",
    "languages": "English, Yiddish",
    "roles_seeking": "Remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "35/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/417318_d7170536822647e7ac82df8cf5db1266.pdf"
  },
  {
    "full_name": "Raizy Genuth",
    "email": "rgenuth05@gmail.com",
    "phone": "+1 848-287-4891",
    "whatsapp": "+1 848-287-4891",
    "location": "New Jersey",
    "current_job_title": "Unemployed currently",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare"
    ],
    "tools_software": "N/a",
    "languages": "English",
    "roles_seeking": "Tbd",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/8185ed_f6db9c1b66414a1f9b9d1eb462acb50e~mv2.jpeg"
  },
  {
    "full_name": "Michelle Lazarus",
    "email": "mich.lazarus@gmail.com",
    "phone": "+27 72 140 3671",
    "whatsapp": "+27 72 140 3671",
    "location": "Johannesburg",
    "current_job_title": "Self employed",
    "education_level": "Associate's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Microsoft office",
    "languages": "English Afrikaans French",
    "roles_seeking": "Tele sales customer service",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "150/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4f2abe_538f9b4079744c5585e7fe35df09ebfa.docx"
  },
  {
    "full_name": "Chaviva Chapler",
    "email": "chavivachapler@gmail.com",
    "phone": "+972 58-786-4880",
    "whatsapp": "+972 58-786-4880",
    "location": "Israel Jerusalem /NJ Newbrunswick  America",
    "current_job_title": "Recruiter",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Any Microsoft software- excel teams word outlook etc  Workday  Monday  Salesforce  Indeed  Hub spot  monster  Apploi  Adobe  Graysacle  Slack",
    "languages": "English ans hebrew",
    "roles_seeking": "Administrative work , Recruitment, customer support",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7c4666_f4fd83d5fde746fd89b005c810e07f74.pdf"
  },
  {
    "full_name": "Russel Shaun Harris",
    "email": "russelharris@outlook.com",
    "phone": "+27 82 495 2904",
    "whatsapp": "+27 82 495 2904",
    "location": "Johannesburg, South Africa",
    "current_job_title": "Customer Experience Manager",
    "education_level": "Associate's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Design",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Salesforce, Milestone, Zoom, Google Docs, Canva,Lightroom, Slack",
    "languages": "English",
    "roles_seeking": "CRM, Public relations, Marketing, Communications, Journalism, Sales Development,",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "300/hour",
    "currency": "ZAR",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/619e31_d24c5cfc21004175829299868e8d0bc0.pdf"
  },
  {
    "full_name": "Michal Grawitzky",
    "email": "michalgrawitzky@gmail.com",
    "phone": "+1 747-389-6073",
    "whatsapp": "+1 747-389-6073",
    "location": "Jerusalem, Isreal",
    "current_job_title": "Secretary",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "Office products, excel, word etc.",
    "languages": "English, Hebrew",
    "roles_seeking": "Supportive",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5f6a73_6bac608b2f7c455db0e356332a88d8b3.docx"
  },
  {
    "full_name": "Simcha Schwartz",
    "email": "kayschwartzwork@gmail.com",
    "phone": "+1 929-375-0187",
    "whatsapp": "+1 929-375-0187",
    "location": "United States",
    "current_job_title": "ABA Para",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Design",
      "Education"
    ],
    "tools_software": "CapCut , Shopify, Adobe,",
    "languages": "English",
    "roles_seeking": "Customer service Rep",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/51cd0e_44c192ae69334d1ba0896bd7b1f058be.pdf"
  },
  {
    "full_name": "Mazal batashvili",
    "email": "mazalbatash@gmail.com",
    "phone": "+1 917-602-8627",
    "whatsapp": "+972 52-839-1846",
    "location": "Israel",
    "current_job_title": "Translator +admin",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Microsoft office, quick books, CRM platforms",
    "languages": "English, hebrew",
    "roles_seeking": "Management , customer service, admin",
    "employment_type": [],
    "desired_salary": "18/hour",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/18e084_d438d0ed0e0f40e08ffded92d00bc247.pdf"
  },
  {
    "full_name": "Shoshana Mays",
    "email": "maysshoshana@gmail.com",
    "phone": "+972 54-649-6599",
    "whatsapp": "+972 54-649-6599",
    "location": "Beit Shemesh",
    "current_job_title": "Programming in seminary",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Office",
    "languages": "English, Hebrew",
    "roles_seeking": "Sales/ administrative",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5eafc8_ca3e8380c5c54f5ba33eaa6be51a3162.pdf"
  },
  {
    "full_name": "Yosef dubow",
    "email": "yossidubow@gmail.com",
    "phone": "+1 216-409-9612",
    "whatsapp": "+1 216-409-9612",
    "location": "New York, America",
    "current_job_title": "HR/Recruitment",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Healthcare",
      "Other"
    ],
    "tools_software": "None",
    "languages": "English",
    "roles_seeking": "Part time after 9-5; weekend hours; remote",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2297aa_f8b09507a64f4f12b4491e4cfc122565.pdf"
  },
  {
    "full_name": "Batya kramer",
    "email": "batykramer@gmail.com",
    "phone": "+27 62 005 3944",
    "whatsapp": "+27 62 005 3944",
    "location": "Johannesburg south africa",
    "current_job_title": "Warehouse",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Mri and Microsoft",
    "languages": "English/Afrikaans, little Hebrew and little Portuguese",
    "roles_seeking": "Admin,logistics, customer service, education",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/6ac47a_af15a0cf9058424f81982100ff5fa892.pdf"
  },
  {
    "full_name": "Miriam nechama melul",
    "email": "miri250105@gmail.com",
    "phone": "+44 7884 967263",
    "whatsapp": "+44 7884 871561",
    "location": "United kingdom,  manchester",
    "current_job_title": "Secretary",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Adobe , microsoft",
    "languages": "English, yiddish",
    "roles_seeking": "Secretary , customer support, property management",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "Gbp",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4241a9_c912e380aaf1401fae45d1184b768458.pdf"
  },
  {
    "full_name": "Nehama Benschar",
    "email": "nehama.nbb@gmail.com",
    "phone": "+1 973-262-7083",
    "whatsapp": "+1 973-262-7083",
    "location": "07012",
    "current_job_title": "Social worker",
    "education_level": "Master's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other",
      "Customer Support"
    ],
    "tools_software": "Microsoft tools, google tools",
    "languages": "English",
    "roles_seeking": "Data entry or similar virtual job with flexible hours",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "40/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7b13db_c3d0ef1076ef4bc7b0d1b98ab85e51cf.pdf"
  },
  {
    "full_name": "Chaim",
    "email": "chaimshiah@gmail.com",
    "phone": "+1 917-474-3011",
    "whatsapp": "+1 912-345-6789",
    "location": "12721",
    "current_job_title": "Admin",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "office",
    "languages": "Yiddish English",
    "roles_seeking": "ANy",
    "employment_type": [],
    "desired_salary": "100000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e3133e_22dc12926f5b498ab3229c5e650f88e7.pdf"
  },
  {
    "full_name": "Jonathan Hemli",
    "email": "hemlijoni@gmail.com",
    "phone": "+1 516-615-5626",
    "whatsapp": "+972 58-458-2514",
    "location": "Petach Tikvah",
    "current_job_title": "Student, Real Estate Deal Consultant",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Design",
      "Other"
    ],
    "tools_software": "Excel, Figma, Wordpress and any software i need to know",
    "languages": "English, Hebrew",
    "roles_seeking": "Underwriter, Mortgage Broker, Financial Analyst, and any role in the financial sector.",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f1dad3_9630dbd05ce54ba9a06d68ec6b46c272.pdf"
  },
  {
    "full_name": "Netanel Zvi Nadav",
    "email": "netanel@nadav.co.uk",
    "phone": "+44 7955 873673",
    "whatsapp": "+44 7955 873673",
    "location": "Israel",
    "current_job_title": "Shop assistant",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Tech/Software",
      "Other"
    ],
    "tools_software": "Premiere pro, Photoshop, davinci resolve, practice evolve, mail chimp, Microsoft Word, Microsoft excel",
    "languages": "English, Hebrew",
    "roles_seeking": "Customer service representative or any other roles available that I will be a good fit for",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "18/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/346780_0319b1a512a04430846890406725d23e.pdf"
  },
  {
    "full_name": "Ariella Merrill",
    "email": "ariellamerrill@gmail.com",
    "phone": "+972 55-500-3302",
    "whatsapp": "+972 55-500-3302",
    "location": "Israel",
    "current_job_title": "Amazon Purchaser and Data Analytics",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [],
    "tools_software": "Excel, Amazon",
    "languages": "English",
    "roles_seeking": "Amazon Researcher",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/bc50d2_66f73f73d6794bf69156f97771245a45.pdf"
  },
  {
    "full_name": "Colin",
    "email": "colinkimble@protonmail.com",
    "phone": "+27 71 351 1633",
    "whatsapp": "+27 71 351 1633",
    "location": "Pretoria",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Design",
      "Customer Support",
      "Education",
      "Healthcare",
      "Other"
    ],
    "tools_software": "Python 3, C#, HTML5, CSS3, Java, Javascript",
    "languages": "English, Afrikaans, Dutch, German, Italian",
    "roles_seeking": "Any roles available",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "Rand",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4b5e68_f5a61880982542bd9aac932316779b37.pdf"
  },
  {
    "full_name": "Gavin Morein",
    "email": "gavmorein@gmail.com",
    "phone": "+27 82 888 8898",
    "whatsapp": "+27 82 888 8898",
    "location": "Johannesburg",
    "current_job_title": "Customer Relations",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Customer Support",
      "Design"
    ],
    "tools_software": "Stay admin, sellercloud, trello",
    "languages": "English",
    "roles_seeking": "Customer relations, sales, admin",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/636b89_8d3297d6cab44008b756f7070b236723.pdf"
  },
  {
    "full_name": "aryeh zeiler",
    "email": "aryehzeiler@gmail.com",
    "phone": "+1 845-405-9573",
    "whatsapp": "+1 845-405-9573",
    "location": "pomona ny",
    "current_job_title": "Care manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Other"
    ],
    "tools_software": "Na",
    "languages": "english",
    "roles_seeking": "Hybrid",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b76f20_28013bf51e7d4bf7bb542ece38bd9c81.docx"
  },
  {
    "full_name": "Goldie Lov",
    "email": "lowgoldy@gmail.com",
    "phone": "+44 7806 809668",
    "whatsapp": "+44 7806 809668",
    "location": "london",
    "current_job_title": "Admin",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Healthcare",
      "Education",
      "Customer Support"
    ],
    "tools_software": "Excel, word",
    "languages": "English yiddish",
    "roles_seeking": "Admin/  secretary  /customer service",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "Dollors/pounds",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/adc16a_7015c1d58af648b2ae6e21f7964bb55f.docx"
  },
  {
    "full_name": "Brady Alex Mayers",
    "email": "bradymayers10@gmail.com",
    "phone": "+27 81 010 9048",
    "whatsapp": "+27 81 010 9048",
    "location": "Johannesburg , South Africa",
    "current_job_title": "N/A",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Google. PowerPoint. Word.",
    "languages": "English.",
    "roles_seeking": "Communication with people through sales.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "100/hour",
    "currency": "Rand",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/376bd3_56b3903ad36741269d44e893c9679bda.docx"
  },
  {
    "full_name": "Samantha Lavenda",
    "email": "samanthalavenda2016@gmail.com",
    "phone": "+1 505-977-4101",
    "whatsapp": "+1 505-977-4101",
    "location": "Chicago, IL",
    "current_job_title": "Project Manager",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Microsoft products - word, outlook, excel, etc, SAP, eclipse, Monday.com, clickup, asana,  canva, adobe",
    "languages": "English",
    "roles_seeking": "Project management, support, admin, open",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "70000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b10537_145e64538d674b0198546de498d2b120.pdf"
  },
  {
    "full_name": "Raymond Sulmonte",
    "email": "raymond_sulmonte@yahoo.com",
    "phone": "+1 516-459-0026",
    "whatsapp": "+1 516-459-0026",
    "location": "Levittown New York United States",
    "current_job_title": "Sales representative",
    "education_level": "Associate's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Excel , Microsoft word , workforce , hubspot, centrex",
    "languages": "English , Spanish",
    "roles_seeking": "Remote sales",
    "employment_type": [],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/bfa411_5d7b41f3a9454c81b9327debf57c1b4a.pdf"
  },
  {
    "full_name": "Russell Katzoff",
    "email": "russell.katzoff@gmail.com",
    "phone": "+27 82 805 8667",
    "whatsapp": "+27 82 805 8667",
    "location": "Johannesburg, South Africa",
    "current_job_title": "Self Employed",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Xero, Excel",
    "languages": "English",
    "roles_seeking": "Virtual CFO",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "1000/hour",
    "currency": "Rand",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e06ace_e9b10185836e4c6394d12e106582499a.pdf"
  },
  {
    "full_name": "Mlaky Katz",
    "email": "mreiner0603@gmail.com",
    "phone": "+972 53-377-5357",
    "whatsapp": "+972 53-377-5357",
    "location": "ISREAL",
    "current_job_title": "CUSTOMER SREVICE REPRESENTITIVE",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Marketing",
      "Other"
    ],
    "tools_software": "slack. pos, excel,message collab....",
    "languages": "English,Yiddish",
    "roles_seeking": "customer service , sales,secretarieal..",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "flexible",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/87b0b4_60d579b0b7aa45638921d870c6dc52eb.pdf"
  },
  {
    "full_name": "Basya Deitsch",
    "email": "basya@redmrk.com",
    "phone": "+1 718-844-7177",
    "whatsapp": "+1 718-844-7177",
    "location": "Flushing, NY",
    "current_job_title": "Graphic & Web Designer",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Adobe Creative Suite, Figma, HTML, CSS, Liquid, Shopify, Wordpress",
    "languages": "English",
    "roles_seeking": "Graphic Design, Web Design, UX/UI, Marketing, E-Commerce",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "90000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/fad996_e70466a0ce4c40a3875447cd9a630160.pdf"
  },
  {
    "full_name": "Isaac Gross",
    "email": "azikg2945@gmail.com",
    "phone": "+1 929-617-5446",
    "whatsapp": "+1 862-346-7781",
    "location": "BROOKLYN/Jerusalem",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Design",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Adobe Ai/I'd word exel",
    "languages": "Yiddish English קצת Hebrew",
    "roles_seeking": "Remote",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/b94d34_1a50febb68f14a209bbce773cc5c7500~mv2.jpg"
  },
  {
    "full_name": "Adam Braverman",
    "email": "s3547062@gmail.com",
    "phone": "+972 50-876-5539",
    "whatsapp": "+972 50-876-5539",
    "location": "Ashdod",
    "current_job_title": "Warehouse coordinator",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [],
    "tools_software": "Python, Java, C++, JavaScript, HTML/CSS, SQL",
    "languages": "English",
    "roles_seeking": "I’m looking for roles where I can apply my technical skills while continuing to grow and learn. Positions in software development, QA, data analysis, or DevOps are of particular interest to me, as they combine problem-solving with practical impact. I’m also open to opportunities that involve teaching, training, or client support, as I enjoy working with people and explaining technical concepts in a clear way.",
    "employment_type": [],
    "desired_salary": "68/hour",
    "currency": "₪‎",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/69ad0c_9d65a1d4bf26439da1d228df5d8d1303.pdf"
  },
  {
    "full_name": "AVROM RUBINFELD",
    "email": "avromrubinfeld@gmail.com",
    "phone": "+1 347-971-1564",
    "whatsapp": "+1 347-971-1564",
    "location": "Brooklyn, USA",
    "current_job_title": "Freelance photographer",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Design"
    ],
    "tools_software": "Adobe Lightroom, Adobe Photoshop",
    "languages": "English, Yiddish",
    "roles_seeking": "Marketing, Design, Management",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "75000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4ec552_4f491b04fe0e4549813f565d8483f18c.docx"
  },
  {
    "full_name": "Blimie Twerski",
    "email": "blimie@blimiet.com",
    "phone": "+1 414-758-8604",
    "whatsapp": "+1 414-758-8604",
    "location": "Milwaukee, USA",
    "current_job_title": "Interior Designer / Space Planner",
    "education_level": "Associate's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Design"
    ],
    "tools_software": "AutoCAD, Adobe Creative Suite",
    "languages": "English, Yiddish",
    "roles_seeking": "Remote - interior design, space planning, drafting",
    "employment_type": [],
    "desired_salary": "75000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b97a8b_a793120047e344adae0d4261c9a01433.pdf"
  },
  {
    "full_name": "Jonathan Rose",
    "email": "jonathanpaulrose1977@gmail.com",
    "phone": "+972 54-281-1605",
    "whatsapp": "+972 54-281-1605",
    "location": "Ganey Tikva",
    "current_job_title": "Sales",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Customer Support"
    ],
    "tools_software": "All",
    "languages": "Englsih",
    "roles_seeking": "Sales",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "40/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/51e8a9_7f38deb7ea4846dca088dc6e29b30826.docx"
  },
  {
    "full_name": "Grey Woolf",
    "email": "aaronwoolf23@gmail.com",
    "phone": "+972 50-551-6297",
    "whatsapp": "+972 50-551-6297",
    "location": "Jerusalem",
    "current_job_title": "Photography & Film maker",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Other"
    ],
    "tools_software": "Python",
    "languages": "English",
    "roles_seeking": "Sales Representative",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "40",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9277fa_cf3b14b7779b4419a69cf70be761a8b6.pdf"
  },
  {
    "full_name": "Raphael Maier",
    "email": "raphaelmaier1@gmail.com",
    "phone": "+32 486 78 72 28",
    "whatsapp": "+32 486 78 72 28",
    "location": "antwerp,Belgium",
    "current_job_title": "Accountant",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "OFFICE, AS400,Getpaid,",
    "languages": "English, French, Dutch, German, Spanish",
    "roles_seeking": "remote administrative work",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/25b186_13f57fa6d7d241c4ac448bd40e3fbceb.pdf"
  },
  {
    "full_name": "Joel Harbor",
    "email": "mgroupten@gmail.com",
    "phone": "+972 52-314-8777",
    "whatsapp": "+972 52-314-8777",
    "location": "Tel aviv Israel",
    "current_job_title": "Account manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Other"
    ],
    "tools_software": "Slack. Crm systems.  Microsoft.",
    "languages": "English",
    "roles_seeking": "Business roles",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "60000/year",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c64b40_66bae29752b34890a8b24780840ba299.pdf"
  },
  {
    "full_name": "Esty Jacobs",
    "email": "estyk0905@gmail.com",
    "phone": "+44 7735 686765",
    "whatsapp": "+44 7450 576172",
    "location": "London",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": ".",
    "languages": "English, Yiddish",
    "roles_seeking": "Admin",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "18/hour",
    "currency": "Pounds",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/37ac42_f66c5b6f71d3436990a572824103cc2c.pdf"
  },
  {
    "full_name": "Adina Matzner",
    "email": "adinalewenstein@gmail.com",
    "phone": "+32 487 71 24 67",
    "whatsapp": "+41 78 784 71 17",
    "location": "Antwerp, Belgium",
    "current_job_title": "At the moment not working",
    "education_level": "Associate's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Microsoft Office",
    "languages": "German, English, Yiddish",
    "roles_seeking": "Anything",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "28/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/133cc8_dfc8e3f2023c43da8e140459b5b726b6.pdf"
  },
  {
    "full_name": "Joshua Greenbaum",
    "email": "joshuagreenbaum2@gmail.com",
    "phone": "+972 54-794-2311",
    "whatsapp": "+972 54-794-2311",
    "location": "Safed, Israel",
    "current_job_title": "Student",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other:"
    ],
    "tools_software": "N/A",
    "languages": "English",
    "roles_seeking": "Entry level customer service or data entry",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2bfdee_477750e9c3474d79a215dfaaed860dd7.pdf"
  },
  {
    "full_name": "Rivka Gluck",
    "email": "rivkatendler@gmail.com",
    "phone": "+1 929-996-7499",
    "whatsapp": "+1 732-288-6241",
    "location": "Jerusalem, Israel",
    "current_job_title": "Secretary /admin assistant",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "Monday.com, kixie, steak",
    "languages": "English",
    "roles_seeking": "Remote secretary/admin/data entry",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/022622_7160ef6b046d4952ab2c026edaa62bc7.docx"
  },
  {
    "full_name": "Chana Schenker",
    "email": "annaschen1@gmail.com",
    "phone": "+1 929-728-5702",
    "whatsapp": "+1 929-728-5702",
    "location": "United States",
    "current_job_title": "Childcare",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Healthcare"
    ],
    "tools_software": "Crm excel",
    "languages": "English Hebrew",
    "roles_seeking": "Bookkeeping",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "35/hour",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e8d1bd_73736b2adc2148df99c2363fbdecf772.pdf"
  },
  {
    "full_name": "Chaim Greenberg",
    "email": "lifeyg@gmail.com",
    "phone": "+972 54-776-5926",
    "whatsapp": "+972 54-776-5926",
    "location": "Jerusalem",
    "current_job_title": "VP Business Development",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "CRM's of all types and the standard work tools for business management",
    "languages": "Hebrew and English - full fluency",
    "roles_seeking": "Managerial, Business Development - work that involves communication with large companies",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "180000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/a51af2_d3eca4b74ce543eabd1e11249f83e4d6.pdf"
  },
  {
    "full_name": "Ryan Macks",
    "email": "ryanmacks1@gmail.com",
    "phone": "+972 58-798-9314",
    "whatsapp": "+972 58-798-9314",
    "location": "Modiin, Israel",
    "current_job_title": "Strategic Operations and Data Insights",
    "education_level": "Master's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software",
      "Education",
      "Other"
    ],
    "tools_software": "Excel, PowerBI, Salesforce, SQL, Python, SAS, STATA",
    "languages": "English, Hebrew",
    "roles_seeking": "Operations, Strategy, Business Analyst, Project Management",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "300000/year",
    "currency": "Israeli New Sheqel",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/362330_ce3f473b5675431d87ae370cbc91d0d3.docx"
  },
  {
    "full_name": "Baila Abramczyk",
    "email": "bailaabrams@gmail.com",
    "phone": "+1 845-428-2321",
    "whatsapp": "+972 55-339-6867",
    "location": "Jerusalem",
    "current_job_title": "Intake Coordinator (currently unemployed)",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Healthcare"
    ],
    "tools_software": "Microsoft",
    "languages": "English, Yiddish",
    "roles_seeking": "Administrative, research type",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/108ac4_8b4b32777ad84582bd0755d91475ea1a.pdf"
  },
  {
    "full_name": "chaya nachmenson",
    "email": "chayanach13@gmail.com",
    "phone": "+1 347-876-8569",
    "whatsapp": "+1 346-876-8569",
    "location": "currently in brooklyn until october, then in Jerusalem",
    "current_job_title": "film student",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "office",
    "languages": "english and hebrew",
    "roles_seeking": "remote part time office work, mostly on weekends",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1d7551_63970fb676ef4bbcbadab051b3b92e33.pdf"
  },
  {
    "full_name": "Aviel Parente",
    "email": "parenteaviel@gmail.com",
    "phone": "+1 323-501-1689",
    "whatsapp": "+1 323-501-1689",
    "location": "Jerusalem, Israel",
    "current_job_title": "Student",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Slack, G Suite, Office 365, Appfolio, Trello",
    "languages": "English, Hebrew",
    "roles_seeking": "Open to anything",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/e6120e_447b4212b59e445084b1de44768a290a~mv2.jpg"
  },
  {
    "full_name": "Hinda ende",
    "email": "necha.hindy@gmail.com",
    "phone": "+55 11 97888-9924",
    "whatsapp": "+55 11 97888-9924",
    "location": "Sao paulo, Brasil",
    "current_job_title": "Stay at home mom and scub tech student",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "I am proficient in all google workspace tools, and also some microsoft tools like excel, word and powerpoint",
    "languages": "English, portuguese, hebrew, spanish",
    "roles_seeking": "I am seeking a part time, remote role that can be done from sao paulo, brazil. Could be tech/organizing/sales/trabslation related",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "Dolar",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2f4621_e4525021e4164f2396e635a756c4ffb1.pdf"
  },
  {
    "full_name": "Chany Tirnauer",
    "email": "talchaim679@gmail.com",
    "phone": "+32 467 81 30 27",
    "whatsapp": "+32 467 81 30 27",
    "location": "Antwerp, Belgium",
    "current_job_title": "teacher",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Tech/Software"
    ],
    "tools_software": "word, excel, acc,",
    "languages": "english, yiddish, flemish",
    "roles_seeking": "office, secretary, office management,",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "18/hour",
    "currency": "euro",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4fb264_3408c9696c3d41c382b6360aa90caeb8.pdf"
  },
  {
    "full_name": "Huda  Edelstein",
    "email": "judahedelstein@gamil.com",
    "phone": "+1 929-884-1068",
    "whatsapp": "+1 845-945-1497",
    "location": "Jerusalem isreal",
    "current_job_title": "Unemployed",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Healthcare",
      "Customer Support"
    ],
    "tools_software": "Framer, Microsoft apps",
    "languages": "Englisg",
    "roles_seeking": "Office, Work, etc.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/3eb246_ac34c5658d30433ab2df12b9ca033969.pdf"
  },
  {
    "full_name": "Refoel Rothschild",
    "email": "refoelroth@gmail.com",
    "phone": "+32 483 51 08 20",
    "whatsapp": "+32 487 32 54 71",
    "location": "Antwerp, Belgium",
    "current_job_title": "Bookkeeper",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Slack, excel, various bookkeeping software",
    "languages": "English, German, Yiddish",
    "roles_seeking": "Secretarial / Office work",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "18/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/366f82_c5f0e62a5c774437bd03d5d229da2110.docx"
  },
  {
    "full_name": "Akiva Mayteles",
    "email": "akivamaytel@gmail.com",
    "phone": "+972 52-500-3600",
    "whatsapp": "+972 58-415-9206",
    "location": "Jerusalem",
    "current_job_title": "Translator",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "MemoQ, Loft 2.0, Microsoft Word, Adobe,",
    "languages": "English, Yiddish, Hebrew",
    "roles_seeking": "Translator, Transcriber",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "23/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d9ed4e_3d54aba615124057a11f0b5cebd48ff6.pdf"
  },
  {
    "full_name": "Solomon Weissbraun",
    "email": "solweissbraun@gmail.com",
    "phone": "+972 55-331-9132",
    "whatsapp": "+44 7902 860425",
    "location": "Jerusalem",
    "current_job_title": "Student",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Microsoft word, Microsoft Excel",
    "languages": "English",
    "roles_seeking": "Challenging roles with good learning experiences",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/02e347_e4925e4f5c2d45eb8416f6d85a2f68b4~mv2.jpg"
  },
  {
    "full_name": "Talia Anker",
    "email": "taliaamir97@gmail.com",
    "phone": "+1 310-871-4821",
    "whatsapp": "+1 310-871-4821",
    "location": "Kiryat ata, Israel",
    "current_job_title": "Na",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Education",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Excel",
    "languages": "English, Hebrew",
    "roles_seeking": "Remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "60000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f58fc9_698cfa0180164ac29e166cc96b71014b.pdf"
  },
  {
    "full_name": "Chava Natik",
    "email": "chavanatik@gmail.com",
    "phone": "+1 321-234-6578",
    "whatsapp": "+1 438-357-5452",
    "location": "Brooklyn, USA",
    "current_job_title": "Social Media Manager",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Design",
      "Education"
    ],
    "tools_software": "Google Docs, Gmail, Google Drive, Microsoft Office Suite, Excel",
    "languages": "English",
    "roles_seeking": "Administrative Assistant, Logistics, and Social Media Manager",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "17",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7247b2_fb6cb4a9ab1845ad9abe9e0772b815f4.pdf"
  },
  {
    "full_name": "Rivka sloshay",
    "email": "sloshayrivka@gmail.com",
    "phone": "+1 929-380-1768",
    "whatsapp": "+1 646-315-0810",
    "location": "Jerusalem, Israel",
    "current_job_title": "Server back in New York now in seminary so looking for a job would be amazing if I could find one that aligns with my career goals but I am open to any job",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support",
      "Other:"
    ],
    "tools_software": "Microsoft",
    "languages": "English, Yiddish semi fluent can understand everything but speaking is a little choppy",
    "roles_seeking": "Anything",
    "employment_type": [],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8ef47e_5c7d5cdf46ce4fd798eaa32329301146.docx"
  },
  {
    "full_name": "Raanan Klatzkin",
    "email": "raananklatz@gmail.com",
    "phone": "+27 71 647 5818",
    "whatsapp": "+27 71 647 5818",
    "location": "Johannesburg",
    "current_job_title": "Operations manager",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Xero accounting software",
    "languages": "English",
    "roles_seeking": "Bookkeeping, operations, managing",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d93127_bd24418fe2bc445da6d8bd36dfbd1b5c.pdf"
  },
  {
    "full_name": "Chayim Goldberg",
    "email": "goldbergchayim@gmail.com",
    "phone": "+972 53-550-5340",
    "whatsapp": "+972 53-550-5340",
    "location": "Jerusalem",
    "current_job_title": "Real estate agent/ salesperson",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Excel, r net",
    "languages": "English, Yiddish, Ivrit",
    "roles_seeking": "Sales, telemarketing, marketing, business advisory",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e0585b_4582cd3785bb47e58012e23679a4d55b.pdf"
  },
  {
    "full_name": "Pinchas Goldstein",
    "email": "rpag18@gmail.com",
    "phone": "+1 786-623-5016",
    "whatsapp": "+972 53-936-1128",
    "location": "Tsfat, Israel",
    "current_job_title": "Commodity Resourcing",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Other"
    ],
    "tools_software": "Microsoft word, excel",
    "languages": "English, Hebrew and Yiddish",
    "roles_seeking": "Business development",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e361c3_0111fadec3f54a36a9515505513ce2dd.pdf"
  },
  {
    "full_name": "Nechama Shechter",
    "email": "dinigottlib@gmail.com",
    "phone": "+1 786-691-8813",
    "whatsapp": "+1 786-691-8813",
    "location": "Brooklyn",
    "current_job_title": "Para professional",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "PowerPoint, Microsoft",
    "languages": "English, Hebrew",
    "roles_seeking": "Any",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": null,
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f296f6_cddf9cf4e2424759a980942d657d17a5.docx"
  },
  {
    "full_name": "Henna Goldstein",
    "email": "hennagoldstein@gmail.com",
    "phone": "+1 786-623-5016",
    "whatsapp": "+972 53-865-9622",
    "location": "Tsfat, Israel",
    "current_job_title": "Preschool Teacher",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Healthcare",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Microsoft word, excel",
    "languages": "English",
    "roles_seeking": "Customer Care",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e361c3_b8c026c524924826a029ad73009bd008.pdf"
  },
  {
    "full_name": "Yocheved Weinstock",
    "email": "yocheved628@gmail.com",
    "phone": "+972 53-238-4330",
    "whatsapp": "+1 845-587-0831",
    "location": "Jerusalem",
    "current_job_title": "Freelancer",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Education",
      "Marketing",
      "Design",
      "Healthcare",
      "Other"
    ],
    "tools_software": "N/A",
    "languages": "English, Yiddish",
    "roles_seeking": "Secretarial",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "American dolllar",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/032335_369399836cca46c395a2063ca86dec23.pdf"
  },
  {
    "full_name": "nosson crystal",
    "email": "cc4162965@gmail.com",
    "phone": "+1 929-993-4127",
    "whatsapp": "+1 800-888-8888",
    "location": "beis shemesh",
    "current_job_title": "secretary",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Design",
      "Customer Support",
      "Education"
    ],
    "tools_software": "word, excel;some experience with photoshop, illustrator",
    "languages": "English, yiddish,",
    "roles_seeking": "secretary, customer service, design",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/908695_8ac16c7947014d8680ba1424b507434c.pdf"
  },
  {
    "full_name": "Malka",
    "email": "malkasloshay@gmail.com",
    "phone": "+1 845-729-5127",
    "whatsapp": "+1 845-729-5127",
    "location": "MONSEY",
    "current_job_title": "Family volunteer",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Microsoft word excel",
    "languages": "English yidish",
    "roles_seeking": "Customer service,, anywhere I can make a difference",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8251d4_b24d24989df34b05848545e49564f6b1.pdf"
  },
  {
    "full_name": "Adina Feldman",
    "email": "adinafeldman18@gmail.com",
    "phone": "+27 82 570 8583",
    "whatsapp": "+27 82 570 8583",
    "location": "Johannesburg",
    "current_job_title": "Remedial therapist/teacher",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "Microsoft and Google Suite",
    "languages": "English",
    "roles_seeking": "Marking exams, data capture, transcription, admin, proofreading",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "550/hour",
    "currency": "SA Rand",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f500db_7c8308943520467084173df465f6c8cc.pdf"
  },
  {
    "full_name": "Ruth Maurer",
    "email": "ruthiemaurer@gmail.com",
    "phone": "+1 917-635-2117",
    "whatsapp": "+1 917-635-2117",
    "location": "Israel",
    "current_job_title": "Unemployed",
    "education_level": "Master's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Customer Support"
    ],
    "tools_software": "R, Java, Julia, SPSS, Python, SQL, Power BI, Tableau, AI Tools, Survey Monkey, MicrosoZ Oﬃce, Google Suite and Social Media",
    "languages": "English",
    "roles_seeking": "Data Analyst/Scientist , Office Managerial Positions",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "75000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e4cc39_4d0ced625cdf4ef7b051da130da16df3.pdf"
  },
  {
    "full_name": "Judah",
    "email": "judahedelstein@gmail.com",
    "phone": "+972 55-337-2447",
    "whatsapp": "+1 845-945-1497",
    "location": "Jerusalem",
    "current_job_title": "Founder of bijou bloss as well as founder at wolf capital",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Customer Support",
      "Healthcare"
    ],
    "tools_software": "Excel etc",
    "languages": "English",
    "roles_seeking": "Anything looking for work experience",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/94add1_08056d16f730480f8a81d7021ae057fd.pdf"
  },
  {
    "full_name": "Moshe Sacks",
    "email": "moshesacks24@gmail.com",
    "phone": "+1 310-623-2048",
    "whatsapp": "+1 213-577-9586",
    "location": "Los Angeles / Israel",
    "current_job_title": "N/a",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support"
    ],
    "tools_software": "Law office. Fitness",
    "languages": "English",
    "roles_seeking": "Entry level. Remote",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "US",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/01127f_66ec14af30834c8d8993cad78e6b3e7a.pdf"
  },
  {
    "full_name": "Brina Korf",
    "email": "brinakorf@gmail.com",
    "phone": "+1 773-273-1806",
    "whatsapp": "+1 773-273-1806",
    "location": "Brooklyn NY",
    "current_job_title": "None",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "Microsoft, Google",
    "languages": "English",
    "roles_seeking": "VA, Admin Assistant",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "23/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7dfe65_80584b9311964ed4959918df0fe627da.pdf"
  },
  {
    "full_name": "Saul Danilewitz",
    "email": "sauldanilewitz@gmail.com",
    "phone": "+27 83 627 3818",
    "whatsapp": "+27 83 627 3818",
    "location": "Johannesburg",
    "current_job_title": "Manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Other:",
      "Healthcare"
    ],
    "tools_software": "MS Office",
    "languages": "english",
    "roles_seeking": "Any remote based role",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/537639_750dd87d60ce48908dd3b3c94921ccde.pdf"
  },
  {
    "full_name": "Binah",
    "email": "phoebebodkin@gmail.com",
    "phone": "+1 857-396-7997",
    "whatsapp": "+1 857-396-7997",
    "location": "Brooklyn",
    "current_job_title": "Healing facilitator/ poet/ massage therapist",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Education",
      "Design",
      "Healthcare",
      "Other"
    ],
    "tools_software": "Canva",
    "languages": "English Spanish French",
    "roles_seeking": "Creative consulting, editing, wellness and healing support, coaching / sound boarding",
    "employment_type": [],
    "desired_salary": "45/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/708ca0_c3e4488c5069412f8af3920cff8074ae.docx"
  },
  {
    "full_name": "Nechama Lieberman",
    "email": "nechamaschwarz1@gmail.com",
    "phone": "+972 53-416-7316",
    "whatsapp": "+972 53-416-7316",
    "location": "Israel",
    "current_job_title": "Grant Writer",
    "education_level": "Associate's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "CRM Tracking",
    "languages": "English and Yiddish",
    "roles_seeking": "My experience, training and skills are in the Writing, Marketing, Communications and Editing areas. B''H I have qualifications and experience in Administration, Creative Writing and Copywriting.",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "16/hour",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/12c141_34d336662d4c4f958e8be0deb6a4ca7c.pdf"
  },
  {
    "full_name": "Jasmine Malka Bokobza",
    "email": "malkabokobza@gmail.com",
    "phone": "+972 58-646-0230",
    "whatsapp": "+972 58-646-0230",
    "location": "Israel",
    "current_job_title": "Aba Professional",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "Quickbooks, rethink",
    "languages": "English, Hebrew",
    "roles_seeking": "Consistent hands on role",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c54aa4_70bf8a738d8f44fdb14abb5486122e1b.docx"
  },
  {
    "full_name": "Miriam sommer",
    "email": "tutisomer@gmail.com",
    "phone": "+972 53-720-7271",
    "whatsapp": "+972 53-720-7271",
    "location": "London",
    "current_job_title": "Not working at the moment",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Marketing",
      "Design",
      "Other"
    ],
    "tools_software": "XL, outlook, canva, photoshop, back office tools",
    "languages": "English, Hebrew",
    "roles_seeking": "Administration, customer service, secretary, back office",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "14/hour",
    "currency": "£ British pound",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/16181b_d0db575fbe9e4a6aa356257a74a1e6cb.docx"
  },
  {
    "full_name": "Rachel Oster",
    "email": "rachel.m.aizenman@gmail.com",
    "phone": "+1 843-467-4896",
    "whatsapp": "+1 843-467-4896",
    "location": "+1",
    "current_job_title": "Software Developer",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Education"
    ],
    "tools_software": "Javascript, React",
    "languages": "English, Hebrew",
    "roles_seeking": "Remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ba0952_672217f45d884c48957203bc4cdb9e15.pdf"
  },
  {
    "full_name": "Faigy jacob",
    "email": "chanajacob8@gmail.com",
    "phone": "+32 485 41 97 39",
    "whatsapp": "+32 486 72 85 99",
    "location": "Antwerpen",
    "current_job_title": "Secretary",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Customer Support"
    ],
    "tools_software": "Quickbooks.Excel.word.etc",
    "languages": "English",
    "roles_seeking": "Secretary .costumer service",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "13/hour",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9f8544_d33ae9871ea9456e97ea24a4d867af6d.docx"
  },
  {
    "full_name": "Nikki Bailowitz Marino",
    "email": "nbailowitz@gmail.com",
    "phone": "+972 53-335-7077",
    "whatsapp": "+972 55-332-3610",
    "location": "Jerusalem Israel",
    "current_job_title": "Manager",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Exel, microsoft, PowerPoint",
    "languages": "English",
    "roles_seeking": "Office manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/26576f_931f9a3ce91a4d20b051dd30343d470e.pdf"
  },
  {
    "full_name": "Rachel Moalem",
    "email": "rachelmoalem967@gmail.com",
    "phone": "+972 53-550-1703",
    "whatsapp": "+972 53-550-1703",
    "location": "Beit Shemesh Israel",
    "current_job_title": "Office administrator",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support",
      "Education",
      "Healthcare"
    ],
    "tools_software": "Slack keap teambrige outlook many more",
    "languages": "English and Hebrew",
    "roles_seeking": "Office manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/14a12b_cc9711123b1645de873121b79a09f5be.docx"
  },
  {
    "full_name": "Miriam Serkez",
    "email": "mircircus@gmail.com",
    "phone": "+972 58-709-8253",
    "whatsapp": "+972 58-709-8253",
    "location": "ramat gan, Israel",
    "current_job_title": "Naturopath, Event coordinator",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Design",
      "Education",
      "Healthcare"
    ],
    "tools_software": "microsoft",
    "languages": "English, Hebrew",
    "roles_seeking": "project manager, event coordinator, health coach",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c5a03a_836dcc8fe0504b95bfef46df33639e0e.pdf"
  },
  {
    "full_name": "Shalom Friedman",
    "email": "sholomsc@gmail.com",
    "phone": "+1 831-291-0839",
    "whatsapp": "+1 831-291-0839",
    "location": "Brooklyn",
    "current_job_title": "Construction estimator and purchaser",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Bluebeam, Google sheets",
    "languages": "English",
    "roles_seeking": "Real estate",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "70000",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e2babb_c40adb0d06054d4e990916ba39a728ca.pdf"
  },
  {
    "full_name": "Yossi Hayward",
    "email": "yossihayward@yahoo.com",
    "phone": "+1 347-267-7167",
    "whatsapp": "+1 347-267-7167",
    "location": "United States",
    "current_job_title": "sales manager",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "quickbooks , numbers",
    "languages": "English",
    "roles_seeking": "sales",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "1000000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8f48f4_123501c06bad4933891191a5400c8ed8.pdf"
  },
  {
    "full_name": "Ricky Berger",
    "email": "bergeryr@gmail.com",
    "phone": "+972 54-845-4244",
    "whatsapp": "+972 54-845-4244",
    "location": "Beit Shemesh, Israel",
    "current_job_title": "Secretary",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Quickbooks",
    "languages": "Yiddish, English",
    "roles_seeking": "Transcriptions, Secretary, Customer service",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "254/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e8727f_a34e74efb1e949deb48330f856e31e31.pdf"
  },
  {
    "full_name": "Sara Rivky  Tessler",
    "email": "sararivky15@gmail.com",
    "phone": "+972 55-332-9673",
    "whatsapp": "+972 55-332-9673",
    "location": "Jerusalem,Israel",
    "current_job_title": "Medical biller",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Healthcare"
    ],
    "tools_software": "N/A",
    "languages": "English",
    "roles_seeking": "Hand on job",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/11b7f4_d2d4391dcdde47f88aff5389a7b3cf01.pdf"
  },
  {
    "full_name": "shefra yakhin",
    "email": "shannonkohanfars@gmail.com",
    "phone": "+972 58-781-8370",
    "whatsapp": "+972 58-781-8370",
    "location": "Jerusalem,Israel",
    "current_job_title": "Stay at home mom",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Google and Microsoft",
    "languages": "Persian, English",
    "roles_seeking": "Office Management, Customer Satisfaction, Support, HR",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50/hour",
    "currency": "ILS",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d143c3_f28fbbbaef744229b1815c3d5c2a9a1a.pdf"
  },
  {
    "full_name": "Sharon Leibowitz",
    "email": "sharonlebo@gmail.com",
    "phone": "+972 54-626-5287",
    "whatsapp": "+972 54-626-5287",
    "location": "Modiin",
    "current_job_title": "Director",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare",
      "Education",
      "Customer Support"
    ],
    "tools_software": "Google Workspace, Microsoft, Canva, Monday, Trello",
    "languages": "English",
    "roles_seeking": "Support Roles",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e08745_20ddbdc7156142a9a4f78493bcef206b.pdf"
  },
  {
    "full_name": "Shabsie Moskovitz",
    "email": "shabsiem@gmail.com",
    "phone": "+972 54-307-0058",
    "whatsapp": "+972 54-307-0058",
    "location": "Beit Shemesh, Israel",
    "current_job_title": "Property Manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Education"
    ],
    "tools_software": "Slack, VScode, Clickup, Microsoft Office",
    "languages": "English, Hebrew",
    "roles_seeking": "Administrative or Management",
    "employment_type": [],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4a95a8_df964914a54341fb98c93d190165c755.pdf"
  },
  {
    "full_name": "Rachel Jungreis",
    "email": "racheljungreis36@gmail.com",
    "phone": "+972 58-664-2338",
    "whatsapp": "+972 58-664-2338",
    "location": "Beit Shemesh, Israel",
    "current_job_title": "Accounts Receivable/Payable Specialist",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Dokka, Xero, Excel, AIA, Procore and GCPay",
    "languages": "English",
    "roles_seeking": "Accounts Receivable, Accounts Payable, Office Manager, basic Bookkeeping",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "55/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/3d2e9d_092fa961f88042829b3f5bc7b94ac6d4.docx"
  },
  {
    "full_name": "KAREN SEBBAG",
    "email": "karensebbag72@gmail.com",
    "phone": "+1 972-207-0604",
    "whatsapp": "+1 972-207-0604",
    "location": "DALLAS, TEXAS",
    "current_job_title": "Full-Charge Bookkeeper – Construction Operations Manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "QuickBooks, Yardi, Microsoft Excel, Microsoft Office Suite",
    "languages": "English and French",
    "roles_seeking": "I am seeking remote roles in Bookkeeping, Accounting Support, AP/AR Specialist, and I'm also interested in Property Management related positions. It could be Full-time but prefer Part-time. $23–$28 but I'm open to discussing salary based on the responsibilities and overall fit.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5a32fd_41e927ebdba04dcc9706099326747e90.pdf"
  },
  {
    "full_name": "Alyssa Shull",
    "email": "alyssashull2024@gmail.com",
    "phone": "+972 58-664-3001",
    "whatsapp": "+972 58-664-3001",
    "location": "Tel Aviv, Israel",
    "current_job_title": "Customer success and product manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "Monday,  Jira, Basic SQL, Excel",
    "languages": "English",
    "roles_seeking": "Product manager; Customer success manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "85000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5f0ec1_db7fa7141bff4cd088c8a8897a8b805a.pdf"
  },
  {
    "full_name": "Elchanan Brody",
    "email": "elibrody130@gmail.com",
    "phone": "+972 54-523-2275",
    "whatsapp": "+972 54-523-2275",
    "location": "Beit Shemesh",
    "current_job_title": "Transportation Operations & Booking Coordinator. And Powerlifting Coaching.",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education",
      "Tech/Software",
      "Other"
    ],
    "tools_software": "Billing / invoicing software, WhatsApp, Google maps & waze, Client, Driver, and Trip Management Software, Instagram, Facebook, Google drive / docs",
    "languages": "Hebrew & English",
    "roles_seeking": "From home. Either administration, sales, costumer service, or anything remote.",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8bf22c_7b83626cf4c44c9293f05d4bc7df4d66.pdf"
  },
  {
    "full_name": "Brad Rosen",
    "email": "rosenbrad020@gmail.com",
    "phone": "+972 54-986-1502",
    "whatsapp": "+972 54-986-1502",
    "location": "Israel",
    "current_job_title": "Quality Assurance",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Customer Support",
      "Education",
      "Healthcare"
    ],
    "tools_software": "Windows, Word, Excel, CRM's like Hubspot and much more",
    "languages": "English, Hebrew",
    "roles_seeking": "Full time ( Marketing, Sales, Presales, Lead Generation, Customer Service, Teaching) at Home positions",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "100/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/dbfd3d_5f039bb5a589483a87cadc4df60f38dd.pdf"
  },
  {
    "full_name": "Gilana Goodstein",
    "email": "gilanagoodstein@gmail.com",
    "phone": "+1 516-725-7427",
    "whatsapp": "+1 516-725-7427",
    "location": "Israel",
    "current_job_title": "Cleaner",
    "education_level": "Associate's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Healthcare"
    ],
    "tools_software": "Canva",
    "languages": "English",
    "roles_seeking": "Remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "23/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9a5586_858889ac0a1840e2ba7fe053a3de61e1.docx"
  },
  {
    "full_name": "Shaindel Tatelbaum",
    "email": "shaindel.swift@gmail.com",
    "phone": "+972 54-756-0197",
    "whatsapp": "+972 54-756-0197",
    "location": "Beit shemesh Israel",
    "current_job_title": "Office manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "Excel, word, outlook,",
    "languages": "English Hebrew",
    "roles_seeking": "Office manager, customer service",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4843f3_cfb5592de3844e658867c86be93100da.pdf"
  },
  {
    "full_name": "oroli samuill",
    "email": "oroli5057@gmail.com",
    "phone": "+972 53-540-2523",
    "whatsapp": "+1 416-890-5057",
    "location": "Israel, Jerusalem",
    "current_job_title": "Administrator",
    "education_level": "Master's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Design"
    ],
    "tools_software": "Canva, Video Editor,…",
    "languages": "English,Farsi,Hebrew",
    "roles_seeking": "Office manager",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "70/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/784aff_771d459e41c341479340e75e8c06f00b.pdf"
  },
  {
    "full_name": "Naomi Jacobs",
    "email": "naomijacobs010@gmail.com",
    "phone": "+972 55-773-8513",
    "whatsapp": "+44 7708 069794",
    "location": "Jerusalem",
    "current_job_title": "Radiographer",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare"
    ],
    "tools_software": "Willing to learn",
    "languages": "English",
    "roles_seeking": "Any",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "18",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f13b4d_96a789d79d174443a919a15f0ac8442b.pdf"
  },
  {
    "full_name": "Ron Yekutiel",
    "email": "deborahlev@yahoo.com",
    "phone": "+972 54-693-6006",
    "whatsapp": "+972 54-693-6006",
    "location": "Tel Aviv",
    "current_job_title": "Executive Assistant (remote)",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "Microsoft Office Suite, Google Workspace, Concur, Salesforce, Sage Intacct, ICG Toolbox, Procure-to-Pay, Zoom, Microsoft Teams, Slack",
    "languages": "English",
    "roles_seeking": "Administrative",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/106378_19a46128e94649ba9fc941f66a8349aa.docx"
  },
  {
    "full_name": "Yonina",
    "email": "jsimckes@gmail.com",
    "phone": "+972 58-442-8280",
    "whatsapp": "+1 845-709-2138",
    "location": "Efrat, Israel",
    "current_job_title": "Legal transcriber",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Education",
      "Healthcare"
    ],
    "tools_software": "I don't have specific experience with programs, but I am a quick learner!",
    "languages": "English and some Hebrew",
    "roles_seeking": "Flexible, work-from-home, opportunities for growth within the job",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "22/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/bd11aa_ca128f87114f49ff8a52766e92041ae3.pdf"
  },
  {
    "full_name": "Mendel Oster",
    "email": "ostermendel@gmail.com",
    "phone": "+1 631-933-9716",
    "whatsapp": "+1 631-933-9716",
    "location": "Brookyln",
    "current_job_title": "Sr. Business intelligence analyst",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "Python, SQL, Oracle, Informix, MicroStrategy, Congos, Bi tools, Excel",
    "languages": "English, Hebrew, Yiddish",
    "roles_seeking": "BI analyst/dev or ML engineer",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "160000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b10788_67cba4ed098f4c84885598c74f87abbe.pdf"
  },
  {
    "full_name": "Baila Masin",
    "email": "bayla7823@gmail.com",
    "phone": "+972 53-415-7823",
    "whatsapp": "+972 53-964-7170",
    "location": "Beitar",
    "current_job_title": "Office Manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Monday.com, excel, word, Indesign, premier,",
    "languages": "English and Hebrew",
    "roles_seeking": "Office Manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "23/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/09dba1_abd6ac8f6d8941dda95cb892dd44026c.pdf"
  },
  {
    "full_name": "Nechama",
    "email": "nechamatb@gmail.com",
    "phone": "+972 53-470-8201",
    "whatsapp": "+972 53-470-8201",
    "location": "Israel",
    "current_job_title": "Unemployed",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Other:"
    ],
    "tools_software": "Slack, salesforce, Monday.com, Google",
    "languages": "English Hebrew Yiddish",
    "roles_seeking": "Office manager, customer support",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1d0cee_4d6759384cc443ea82be9acdfe805712.pdf"
  },
  {
    "full_name": "Nadine sabbagh",
    "email": "sbaghn@gmail.com",
    "phone": "+972 54-603-2495",
    "whatsapp": "+972 54-603-2495",
    "location": "Israel",
    "current_job_title": "Office manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare",
      "Customer Support",
      "Education"
    ],
    "tools_software": "Mircrosoft office, Excel",
    "languages": "English, Arabic, Hebrew",
    "roles_seeking": "Administrative Assistant or manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "18/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/48095d_1d99ef60b0c64e66893d0e06ef107f7e.pdf"
  },
  {
    "full_name": "Chana Weissman",
    "email": "ch.wsman@gmail.com",
    "phone": "+972 52-886-8278",
    "whatsapp": "+972 52-886-8278",
    "location": "Beit Shemesh, Israel",
    "current_job_title": "Editing",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Slack",
    "languages": "English",
    "roles_seeking": "customer support, administrative",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/764015_1c6c963bd5f64af9a8be4f0c4bd6e872.pdf"
  },
  {
    "full_name": "Leanne Bar-oz",
    "email": "leannebaroz@sky.com",
    "phone": "+972 54-222-4829",
    "whatsapp": "+972 54-222-4829",
    "location": "Tzur Yitzhak",
    "current_job_title": "Office Manager & Remote Personal Assistant",
    "education_level": "Associate's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare",
      "Other",
      "Paralegal for different Law Firms in Israel for 5 years"
    ],
    "tools_software": "All aspects of Microsoft Programs (Microsoft 365)",
    "languages": "Fluent English & Basic Hebrew",
    "roles_seeking": "Personal/Executive Assistant, Office Manager or Administrator",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "70/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/23a9cb_c9e2bdba77774d3b82f133bab6326a13.pdf"
  },
  {
    "full_name": "Daniella Nassim",
    "email": "daniellanass@icloud.com",
    "phone": "+972 53-361-5507",
    "whatsapp": "+44 7475 612238",
    "location": "Israel, Tel Aviv",
    "current_job_title": "Legal Assistant",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Word, Excel",
    "languages": "English",
    "roles_seeking": "Administrative",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9285e5_87f0d8c252a84a229a91adeec6b68f05.pdf"
  },
  {
    "full_name": "Rachel Klompas",
    "email": "rachelswartz2020@gmail.com",
    "phone": "+972 53-962-7289",
    "whatsapp": "+27 76 860 6099",
    "location": "Israel",
    "current_job_title": "Freelance graphic designer",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Design",
      "Education",
      "Marketing",
      "Other"
    ],
    "tools_software": "Adobe creative suit (photoshop, illustrator, indesign), word, excel,",
    "languages": "English, hebrew",
    "roles_seeking": "Design, illustrator, Secreterial, admin,",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/ff9923_91b88c2e3b7748deaca6a3e0f0f9c5eb~mv2.jpg"
  },
  {
    "full_name": "Miriam hershowitz",
    "email": "mirihershowitz@gmail.com",
    "phone": "+1 347-504-3993",
    "whatsapp": "+1 347-504-3993",
    "location": "Maalot Dafna, Israel",
    "current_job_title": "Administration assistant",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Marketing"
    ],
    "tools_software": "Canva",
    "languages": "English",
    "roles_seeking": "Office manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "23/hour",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c2ad60_e2f643f22d9e44d3a0de200d867a8468.pdf"
  },
  {
    "full_name": "Betzalel Sommer",
    "email": "betzalelsommer@gmail.com",
    "phone": "+972 52-885-0322",
    "whatsapp": "+972 52-885-0322",
    "location": "Israel.jerusalem",
    "current_job_title": "Hr related",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Education",
      "Healthcare",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Monday.Apploi.Indeed.Slack.Zoho.Slack.Crypto softwares.Crypto Wallets .Github.DappRadar.",
    "languages": "English",
    "roles_seeking": "Hr.Selling.Managment.loans financing .Logistic",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "24/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4f6a14_8089c82c77b1427393b0c48199b8f725.docx"
  },
  {
    "full_name": "Malky gluck",
    "email": "malkye1527@gmail.com",
    "phone": "+1 732-773-8190",
    "whatsapp": "+1 917-797-6564",
    "location": "Lakewood, nj moving to ramat eshkol in August",
    "current_job_title": "Home organizer",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Word, excel",
    "languages": "English",
    "roles_seeking": "Office position",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "22/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ce7e3e_c1d59be6a62d4cf8b50f494a9d18057d.docx"
  },
  {
    "full_name": "Gabriel Katz",
    "email": "katzgav@gmail.com",
    "phone": "+972 58-778-3637",
    "whatsapp": "+972 58-778-3637",
    "location": "Jerusalem, Israel",
    "current_job_title": "Research and analysis, IDF",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Excel, Word, powerpoint",
    "languages": "English, Hebrew, (little bit of Spanish",
    "roles_seeking": "Manager / assistant / open for other roles",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "16/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/65c909_43d96b7f1af24110bf826cf18edc2262.pdf"
  },
  {
    "full_name": "Eli Brickman",
    "email": "elk.brickman@gmail.com",
    "phone": "+972 58-789-0422",
    "whatsapp": "+972 58-789-0422",
    "location": "Bet Shemesh, Israel",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "Microsoft Office, Google Suite, some figma",
    "languages": "English",
    "roles_seeking": "Office Management/bookkeeping",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/0201d5_6bde03262a614ddcbda831c8d3502356.pdf"
  },
  {
    "full_name": "Eleora Fine Ganchrow",
    "email": "eleorafine@gmail.com",
    "phone": "+1 516-666-1033",
    "whatsapp": "+1 516-666-1033",
    "location": "Jerusalem, Israel (I am in USA for a week now)",
    "current_job_title": "N/A",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Quickbooks, excel, word",
    "languages": "English (a little Hebrew)",
    "roles_seeking": "Accounting, Secretary/ Management Work, AR/AP, billing (I would be open to full time and part time)",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/027b89_f425487d1f604b16994d9367212cbe43.pdf"
  },
  {
    "full_name": "Elisheva Mullokandov",
    "email": "elishevacohenx@gmail.com",
    "phone": "+972 53-304-9889",
    "whatsapp": "+44 7709 864714",
    "location": "Jerusalem",
    "current_job_title": "Between jobs  due to relocation",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Microsoft, Graphic design",
    "languages": "English",
    "roles_seeking": "Administrative",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "17/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/140e72_818818819d494bf6b4ad48422e7c5e5b.pdf"
  },
  {
    "full_name": "Shira Zimmer",
    "email": "shirazimmerr@gmail.com",
    "phone": "+972 58-465-2807",
    "whatsapp": "+972 58-465-2807",
    "location": "Israel",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support",
      "Education"
    ],
    "tools_software": "Word, autocad, sketchup, etc",
    "languages": "English, Hebrew",
    "roles_seeking": "Administrator, organizational, PA, social media, etc",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "70/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/bf9fbf_7e0750e4bf9f4a6f9c17956eac0b3434.docx"
  },
  {
    "full_name": "Mavira Gutt-Rojas",
    "email": "guttari_09@hotmail.com",
    "phone": "+972 52-849-6078",
    "whatsapp": "+972 52-849-6078",
    "location": "Netanya, Israel",
    "current_job_title": "Content | Project and Administrative Coordination | PR",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Slack, Canva, Monday.com, SalesForce, Office",
    "languages": "Spanish, French, English, Hebrew",
    "roles_seeking": "Jr Project Manager, Jr Project Coordinator, PR",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "54000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/6f1dfc_fa953636a3e344e7a28bf1b1b731f7e8.pdf"
  },
  {
    "full_name": "Nicole Knopp",
    "email": "nicciknopp@gmail.com",
    "phone": "+27 71 826 5255",
    "whatsapp": "+27 71 826 5255",
    "location": "Johannesburg, South Africa",
    "current_job_title": "Executive Assistant",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Customer Support"
    ],
    "tools_software": "Prestashop, woo, shopify, Microsoft, Suite, salesforce",
    "languages": "English",
    "roles_seeking": "Management",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "450/hour",
    "currency": "Rand",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f5dc33_0cafe60b5af144a18ccb98658b4b1abe.pdf"
  },
  {
    "full_name": "Chana Moallim",
    "email": "chanamoallim@gmai.com",
    "phone": "+972 58-629-7922",
    "whatsapp": "+972 58-629-7922",
    "location": "Jerusalem, Israel",
    "current_job_title": "Content Creator",
    "education_level": "Master's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Design",
      "Education"
    ],
    "tools_software": "Slack, Python, bash",
    "languages": "English",
    "roles_seeking": "Junior",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/aabb39_a8db1000e54a43e2871d097cc130d71a.pdf"
  },
  {
    "full_name": "Meira Ramirez",
    "email": "meira.dobkin@gmail.com",
    "phone": "+972 58-692-0745",
    "whatsapp": "+972 58-692-0745",
    "location": "Isreal",
    "current_job_title": "None",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "JavaScript, React, Node.js, MongoDB, REST API, Firebase, SAP, Excel, Word, Outlook",
    "languages": "English ,Hebrew",
    "roles_seeking": "Junior Bookkeeper, Data Entry, Administrative Support",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "18/hour",
    "currency": null,
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b1ce56_9d036d0279674b04aaf038fce64e0e6b.pdf"
  },
  {
    "full_name": "Samantha Abraham",
    "email": "samanthaabraham564@gmail.com",
    "phone": "+972 53-986-9250",
    "whatsapp": "+1 561-639-2305",
    "location": "Jerusalem, Israel",
    "current_job_title": "Nurse assistant",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Healthcare"
    ],
    "tools_software": "NA",
    "languages": "English",
    "roles_seeking": "Anything available!",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/85da49_1695ca3903454c7783f56e5b3ac78ab0.pdf"
  },
  {
    "full_name": "Shayel Aiache",
    "email": "babylu3@yahoo.com",
    "phone": "+1 910-377-1404",
    "whatsapp": "+972 55-500-2345",
    "location": "Tel Aviv-Yafo",
    "current_job_title": "Delivery Agent",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Healthcare",
      "Other"
    ],
    "tools_software": "Microsoft Office and Backoffice",
    "languages": "English, Hebrew, Spanish",
    "roles_seeking": "Office Manager, Human Relations",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f4cc39_560d925b5dc24f4d8e4b31fe5f012127.docx"
  },
  {
    "full_name": "Eli Superstein",
    "email": "elisuperstein@gmail.com",
    "phone": "+1 929-466-6409",
    "whatsapp": "+1 847-909-3710",
    "location": "Buenos Aires, Argentina",
    "current_job_title": "Learning Accounting",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "QuickBooks",
    "languages": "English",
    "roles_seeking": "Bookkeeping",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1b74ca_efd5c9ad278644d39157fe4604e4ee01.pdf"
  },
  {
    "full_name": "rachel kirzner",
    "email": "rkirz@outlook.com",
    "phone": "+1 305-528-8297",
    "whatsapp": "+1 305-528-8297",
    "location": "Miami, USA",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Customer Support",
      "Design"
    ],
    "tools_software": "Autocad",
    "languages": "English , Hebrew is sufficient",
    "roles_seeking": "Remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "22/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/76950a_ac9688d0f3f444cd80812ad86c8fc751.pdf"
  },
  {
    "full_name": "Malka Schmukler",
    "email": "malka491@gmail.com",
    "phone": "+1 505-410-4023",
    "whatsapp": "+1 505-410-4023",
    "location": "Brooklyn",
    "current_job_title": "Real Estate Agent",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support"
    ],
    "tools_software": "Slack, google sheets, salesforce",
    "languages": "English",
    "roles_seeking": "Admin, sales, deal closing",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "40000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b270a9_8f597cd98fb8488ca5b986663e8e2f7a.pdf"
  },
  {
    "full_name": "Olivia Hemli",
    "email": "oliviahorvitz@gmail.com",
    "phone": "+972 58-786-5769",
    "whatsapp": "+972 58-786-5769",
    "location": "Petah Tikvah, Israel",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Google workspace, Microsoft Word, PowerPoint",
    "languages": "English, French, Dutch, Hebrew",
    "roles_seeking": "Secretary",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "18/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/71605c_07dacccba6144e9fa1129f566cad4fc1.docx"
  },
  {
    "full_name": "Lauren Stamelman",
    "email": "laurenstamelman1@gmail.com",
    "phone": "+27 83 250 4265",
    "whatsapp": "+27 83 250 4265",
    "location": "Sandringham, Johannesburg, RSA",
    "current_job_title": "Human Resource and Office Manager",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Microsoft Office Suite, Asana, Trello, HubSpot, PSIBER, Easy Roster, ServCraft",
    "languages": "English",
    "roles_seeking": "Human Resources and/or Administration and/or Executive Assistant",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "420000/year",
    "currency": "ZAR",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ae4dcf_257eff5d606143f683273eb534a33d79.pdf"
  },
  {
    "full_name": "Elisheva Levenson",
    "email": "eli7levenson@gmail.com",
    "phone": "+972 52-736-1334",
    "whatsapp": "+44 7411 635423",
    "location": "Jerusalem",
    "current_job_title": "Accountant",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Quickbooks, IRIS",
    "languages": "English",
    "roles_seeking": "Bookkeeping, accounting",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "45/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/28e92b_64db301a1c7c43e09da9d534e3e9912e.docx"
  },
  {
    "full_name": "Yossi Stern",
    "email": "yossistern123@gmail.com",
    "phone": "+1 347-220-1199",
    "whatsapp": "+972 55-773-1555",
    "location": "Shiloh, Israel",
    "current_job_title": "Wine production technician",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Design",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Salesforce, Streak",
    "languages": "English",
    "roles_seeking": "Sales, Customer support, technician/mechanical",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "36/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2579aa_fe31517183004d37a055bdff91b70bfe.pdf"
  },
  {
    "full_name": "Ilana Bazal",
    "email": "madlikaone@gmail.com",
    "phone": "+1 917-324-5859",
    "whatsapp": "+1 917-324-5859",
    "location": "New York",
    "current_job_title": "QuickBooks",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support"
    ],
    "tools_software": "QuickBooks Remote, Microsoft  Word, Google Drive, CRM, Constant Contact.",
    "languages": "Fluent in Hebrew",
    "roles_seeking": "I am open about it.",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "26/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/eebbb8_a34ca369221b4d689a77b1eccb05400a.pdf"
  },
  {
    "full_name": "Shuli Heller",
    "email": "shulifeldinger@gmail.com",
    "phone": "+972 58-320-5439",
    "whatsapp": "+44 7501 681818",
    "location": "Jerusalem/ירושלים",
    "current_job_title": "secretary",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "Microsoft word, excel, PowerPoint. Acquaint.",
    "languages": "English",
    "roles_seeking": "Anything stimulating",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "70/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/24cdc8_488371b1533c4b17bd6251b35d047438.docx"
  },
  {
    "full_name": "Leeba State",
    "email": "leebastate0@gmail.com",
    "phone": "+972 58-677-9848",
    "whatsapp": "+972 58-677-9848",
    "location": "Jerusalem, Israel",
    "current_job_title": "Bookkeeper",
    "education_level": "Associate's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Marketing",
      "Tech/Software",
      "Customer Support"
    ],
    "tools_software": "Quickbooks, Microsoft 365 , Excel",
    "languages": "English",
    "roles_seeking": "Bookkeeping",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "65000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/da4d86_17573e3b61cb46039e7a66a4ca7be840.pdf"
  },
  {
    "full_name": "Nathanael Ainouz",
    "email": "nathanael.ainouz@gmail.com",
    "phone": "+972 58-412-6770",
    "whatsapp": "+972 58-412-6770",
    "location": "Jerusalem, Israel",
    "current_job_title": "Web/Software developer",
    "education_level": "Master's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "Mendix",
    "languages": "French, English and almost Hebrew",
    "roles_seeking": "I studied 5 years math and physics. Now I am developing apps but I would really like to come back to what I like : math, physics. I have to make a quik refresh of my knowledge and I would be happy to start a carrier in a scientific field.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "80/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d376db_8fca753b90b943c1b4e75579cce7db11.pdf"
  },
  {
    "full_name": "Michelle Storfer",
    "email": "michellestorfer1@gmail.com",
    "phone": "+1 201-647-3278",
    "whatsapp": "+1 201-647-3278",
    "location": "Englewood, USA",
    "current_job_title": "Pre school educator",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Excel,",
    "languages": "English, understand Hebrew fully, speak Hebrew well",
    "roles_seeking": "Book keeping",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "60000",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/63172a_09eb4f52f50347dbae41df41aab11c1b.docx"
  },
  {
    "full_name": "David Sanders",
    "email": "davidjsanders@gmail.com",
    "phone": "+1 718-207-4036",
    "whatsapp": "+1 718-207-4036",
    "location": "Jerusalem, Israel",
    "current_job_title": "Director of Client Onboarding Procedures",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Other",
      "Healthcare"
    ],
    "tools_software": "Office, Visio, Clickup",
    "languages": "English, Hebrew",
    "roles_seeking": "Consulting, Operations, Training",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "200/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/33fce6_2f44b3d423c542e78c8b3fd93c1c032f.pdf"
  },
  {
    "full_name": "Flora Sarah Benady",
    "email": "florasarahwahnich@gmail.com",
    "phone": "+44 7453 564055",
    "whatsapp": "+350 54084013",
    "location": "Gibraltar",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Word, Microsoft, Canva",
    "languages": "English Hebrew Spanish",
    "roles_seeking": "Admin, secretary",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "18/hour",
    "currency": "£",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/0d4d4a_549509481dbc4f27b609ad4cf1ac682d.docx"
  },
  {
    "full_name": "Shulamit R Frankel Rudowski",
    "email": "frankel.rebecca@gmail.com",
    "phone": "+972 55-661-5611",
    "whatsapp": "+44 7968 180837",
    "location": "Israel and UK",
    "current_job_title": "Licensed Coach and Somatic Practitioner",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "N/a",
    "languages": "English, Hebrew",
    "roles_seeking": "Coaching",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "150/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/9ce13b_a66f8ce010e04705b3380e704016ab82.pdf"
  },
  {
    "full_name": "Rebecca Lewis",
    "email": "reachout.rrlewis@gmail.com",
    "phone": "+1 310-880-0317",
    "whatsapp": "+1 310-880-0317",
    "location": "Phoenix, AZ",
    "current_job_title": "Admin Asst.",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Google suite, MS office, CRM, Canva",
    "languages": "English",
    "roles_seeking": "Any remote admin work",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7be87d_11c2223b8fd94dbabe55975f6c6b6c42.pdf"
  },
  {
    "full_name": "Eric Schudy",
    "email": "etoi2pi@gmail.com",
    "phone": "+1 424-234-3677",
    "whatsapp": "+972 58-785-3793",
    "location": "Jerusalem, Israel",
    "current_job_title": "Consultant",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Design",
      "Customer Support",
      "Education",
      "Healthcare"
    ],
    "tools_software": "Anything you throw at me.  Started C programming",
    "languages": "English",
    "roles_seeking": "whatever i can do remotely - find my resume on LinkedIn - Eric Schudy - the only one in the world",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "72/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8513ee_8cf516519a124f48adedb298dff02a7e.rtf"
  },
  {
    "full_name": "Raphael Nacache",
    "email": "raphaelnacache@gmail.com",
    "phone": "+972 58-440-8459",
    "whatsapp": "+972 58-440-8459",
    "location": "Jerusalem, Israel",
    "current_job_title": "Marketing Analyst",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing"
    ],
    "tools_software": "Google Ads and Excel",
    "languages": "English and French",
    "roles_seeking": "Google Ads campaign manager or a job that uses excel and analyse data",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5bc669_926b397037a8499289d5e4519c1a04c1.pdf"
  },
  {
    "full_name": "Victor Yampolsky",
    "email": "tsanhan@gmail.com",
    "phone": "+972 54-651-0255",
    "whatsapp": "+972 54-651-0255",
    "location": "Jerusalem",
    "current_job_title": "Software developer/ DevOps",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Other"
    ],
    "tools_software": "JavaScript html CSS dotnet azure cloud",
    "languages": "English Hebrew Russian",
    "roles_seeking": "Software related solution consisting, developing, architecture",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "150/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ba4fe3_52feea41ab88462a9bdbf1f92a2df59a.pdf"
  },
  {
    "full_name": "Rochel Grosz FKA Diane R. Tishkoff",
    "email": "drtishkoff@me.com",
    "phone": "+972 53-637-2961",
    "whatsapp": "+972 53-637-2961",
    "location": "Jerusalem, Israel",
    "current_job_title": "Creative Copywriter",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Design",
      "Healthcare"
    ],
    "tools_software": "ChatGPT",
    "languages": "English",
    "roles_seeking": "Editing; proofreading; copywriting",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "45/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/0ceb83_53b94f3328eb4b01abfd8026736d5498.pdf"
  },
  {
    "full_name": "baruch leiman",
    "email": "leiman.baruch@gmail.com",
    "phone": "+972 54-220-6263",
    "whatsapp": "+972 54-220-6263",
    "location": "jerusalem, Israel",
    "current_job_title": "backend engineer",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "python, nodejs, k8s, microservices, aws",
    "languages": "english, hebrew",
    "roles_seeking": "programming",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "450000/year",
    "currency": "nis",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2f8fa6_a7a1e298a22f4bf28daadab92d319aee.pdf"
  },
  {
    "full_name": "Esther Steinberg",
    "email": "esther.davidrealestate@gmail.com",
    "phone": "+1 929-493-6480",
    "whatsapp": "+972 55-323-5896",
    "location": "Jerusalem",
    "current_job_title": "Recovery Suplus Specialist",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Design",
      "Other"
    ],
    "tools_software": "Quickbooks Online, Appfolio, Rent Mananger, Notion, Trello, Microsoft Office & Intuit Quickbooks Point of Sale",
    "languages": "English & Yiddish",
    "roles_seeking": "Bookkeeping, Title Insurance & Sales",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "65000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/3e631a_f3b5c1088aa443e5958b9530ef8f0626.pdf"
  },
  {
    "full_name": "Nir Kedar",
    "email": "nir@hydrocore.tech",
    "phone": "+972 58-635-3327",
    "whatsapp": "+972 58-635-3327",
    "location": "Beit Shemesh",
    "current_job_title": "Financial Director",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Excel, Word, Powerpoint, Numbers, Pages, Keynote, SAGE Accounting, etc",
    "languages": "English, Hebrew",
    "roles_seeking": "Bookkeeping",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "100/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/db93fc_ea3cf5f8d19d440eb57c7d02e3ed04c8.pdf"
  },
  {
    "full_name": "Yosef Aron",
    "email": "yossel292@gmail.com",
    "phone": "+972 53-623-3682",
    "whatsapp": "+972 53-623-3682",
    "location": "Jerusalem, Israel",
    "current_job_title": "Kollel",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Xero (Accounting Software)",
    "languages": "English, Hebrew",
    "roles_seeking": "Finance, Accounting, Admin or similar",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "60/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f1778a_19fd9d4fbe9f4f3bad70a5f16a43a2ba.pdf"
  },
  {
    "full_name": "Dovid Chanin",
    "email": "mydchanin@gmail.com",
    "phone": "+1 929-289-8663",
    "whatsapp": "+1 929-289-8663",
    "location": "Brooklyn, NY",
    "current_job_title": "Previous: Junior Underwriter",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Excel, QuickBooks, Adobe Acrobat",
    "languages": "English",
    "roles_seeking": "Something in the accounting sector, preferably under a CPA (I'm currently pursuing a CPA)",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "700000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d637e4_2e04f8acfa424c95b3b6043ba6ff7160.pdf"
  },
  {
    "full_name": "Brucha Fonteijn",
    "email": "brucha3@gmail.com",
    "phone": "+972 58-771-8388",
    "whatsapp": "+44 7593 689297",
    "location": "RBS, Israel",
    "current_job_title": "Finance Administrator",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Education",
      "Other:"
    ],
    "tools_software": "Microsoft",
    "languages": "English",
    "roles_seeking": "Administrative",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "0/hour",
    "currency": "ILS",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/754ec4_ec49d537f5f84730b02da967958f7a6e.pdf"
  },
  {
    "full_name": "chaya markovsky",
    "email": "chaya.markovsky@gmail.com",
    "phone": "+44 7950 803532",
    "whatsapp": "+972 53-925-9477",
    "location": "London",
    "current_job_title": "Nursery practitioner",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Dext, Xero, social media apps, wix, microsoft",
    "languages": "English and hebrew",
    "roles_seeking": "Remote role in either sales, administration, writing, customer service",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/0a76c3_0850d642bbea45caa6f2339c592c5e9f.docx"
  },
  {
    "full_name": "zachy rosenthal",
    "email": "zyr294@gmail.com",
    "phone": "+972 58-627-2589",
    "whatsapp": "+972 58-627-2589",
    "location": "Israel",
    "current_job_title": "Logistics and management",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Sap,",
    "languages": "English,  Hebrew",
    "roles_seeking": "Similar logistics/planning",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "200000/year",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e5f1f9_41f0db98f6474c179eae8efdfb393afe.pdf"
  },
  {
    "full_name": "Volvy Glauber",
    "email": "volvyglauber@gmail.com",
    "phone": "+1 845-512-9144",
    "whatsapp": "+1 845-512-9144",
    "location": "israel jerusalem",
    "current_job_title": "property management",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [],
    "tools_software": "manage go rent mangaer",
    "languages": "Yiddish English",
    "roles_seeking": "property management",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "28/hour",
    "currency": "dollers",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/33f8b2_59eab2179b6f40328563bd47aae79e48.pdf"
  },
  {
    "full_name": "Michael Aaron Glaser",
    "email": "mglaser120@gmail.com",
    "phone": "+1 732-353-9221",
    "whatsapp": "+1 732-353-9221",
    "location": "Flushing",
    "current_job_title": "Fund Accountant",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Design",
      "Other"
    ],
    "tools_software": "Quick Books (beginner), Canvas, Salesforce",
    "languages": "English",
    "roles_seeking": "Remote Part Time in Administration, Finance, Accounting",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/a9ea1c_5e86cc6a286f4efba487ded55c9a17d0.pdf"
  },
  {
    "full_name": "Gilah Shull",
    "email": "gilahshull@gmail.com",
    "phone": "+27 61 499 3654",
    "whatsapp": "+27 61 499 3654",
    "location": "Johannesburg, South Africa",
    "current_job_title": "Student",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "Word, Excel, email",
    "languages": "English",
    "roles_seeking": "Admin or junior bookkeeping",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "16/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/460ca3_57279aa47ffd42f793a8d9a606885d74.pdf"
  },
  {
    "full_name": "Yehuda sirota",
    "email": "ysirotamh@outlook.com",
    "phone": "+1 917-215-1473",
    "whatsapp": "+1 917-215-1473",
    "location": "Brooklyn NY",
    "current_job_title": "Bookkeeper",
    "education_level": "Associate's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Customer Support",
      "Education"
    ],
    "tools_software": "QuickBooks online, Excel",
    "languages": "English",
    "roles_seeking": "Admin, research, accounting",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "65000/year",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/cfe41c_c86cb7246e8a43ecbf1f2aa7b9a62e52.pdf"
  },
  {
    "full_name": "Daniel Sacks",
    "email": "danielysacks@gmail.com",
    "phone": "+972 58-572-2571",
    "whatsapp": "+972 58-572-2571",
    "location": "Beersheva",
    "current_job_title": "Operations and Data Analyst",
    "education_level": "Bachelor's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Google Suite, Microsoft suite (Excel at an advanced level), MDA property Manager, SQL",
    "languages": "English",
    "roles_seeking": "Real Estate Related",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ace3b6_0b6632cafa4a4aa5991c0f9a90b6f617.pdf"
  },
  {
    "full_name": "Eric Amiel",
    "email": "eric.amiel1@gmail.com",
    "phone": "+972 54-783-8655",
    "whatsapp": "+972 54-783-8655",
    "location": "Jerusalem, Israel",
    "current_job_title": "Global Delivery and Program Manager",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "Azure DevOps, Jira, Microsoft Project, Monday, Word, Excel, PowerPoint",
    "languages": "English, French, Hebrew",
    "roles_seeking": "Delivery Manager, Program Manager, Project Manager, PMO",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "300/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c4195d_ac6a6977fcb046cdbbc9343c33fb38d0.pdf"
  },
  {
    "full_name": "Baruch",
    "email": "bcnok12@gmail.com",
    "phone": "+972 54-544-1725",
    "whatsapp": "+1 718-552-6683",
    "location": "Israel",
    "current_job_title": "Counselor for individuals with mental health issues",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare",
      "Education",
      "Other"
    ],
    "tools_software": "Excel",
    "languages": "English and Hebrew that I can communicate with",
    "roles_seeking": "Anything from entry level office work to something dealing with people, like recruiting, customer support or sales.",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/329a89_f73686ae10f94d5daddc7ffb39be5e42.pdf"
  },
  {
    "full_name": "Shalom Volkowitz",
    "email": "stephenvolkowitz29@gmail.com",
    "phone": "+1 347-794-3598",
    "whatsapp": "+1 347-794-3598",
    "location": "New York",
    "current_job_title": "Registered Behvaior Technician",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Healthcare"
    ],
    "tools_software": "Rebel",
    "languages": "English",
    "roles_seeking": "Office manager position",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/52c5f5_d93f4eac06ae4061a7bc72b7795fda6c.pdf"
  },
  {
    "full_name": "Akiva Nussbaum",
    "email": "akivanuss@gmail.com",
    "phone": "+1 917-704-3468",
    "whatsapp": "+1 917-704-3468",
    "location": "Airmont NY",
    "current_job_title": "N/a",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Education",
      "Healthcare",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Office, excel",
    "languages": "English, yiddish, hebrew",
    "roles_seeking": "Open to anything",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "45/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/604dae_5a7419e748684a3c9808a1264c9220b0.pdf"
  },
  {
    "full_name": "Aviva Fort",
    "email": "aviva@digitalnapalm.net",
    "phone": "+972 53-803-7621",
    "whatsapp": "+972 53-803-7621",
    "location": "בית שמש",
    "current_job_title": "Creative Content Manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support",
      "Tech/Software",
      "Other"
    ],
    "tools_software": "Rhino 3D, Adobe Creative Suite, Unreal Engine basics, Office, Pipedrive, Telegram and Discord setup",
    "languages": "English, Hebrew",
    "roles_seeking": "Entry level: Rhino3D or Unreal Engine. Expert level: content creation (long-form and memes), project manager, operations, graphic design, only X, LinkedIn and Reddit social media, temp jobs, full-time if the terms are right",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e176f1_9bae1eae0e334ebc88066a0bd25d145e.pdf"
  },
  {
    "full_name": "Brocha Leah Barmatz",
    "email": "brochalbarmatz@gmail.com",
    "phone": "+972 55-773-6226",
    "whatsapp": "+1 848-299-2597",
    "location": "Jerusalem",
    "current_job_title": "Admin Assistant",
    "education_level": "Associate's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Marketing",
      "Other"
    ],
    "tools_software": "Excel, Word, Quickbooks",
    "languages": "English, Hebrew",
    "roles_seeking": "Admin assistant,",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "60000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/bc3a96_98e61b41be004694b587c2fc407e6172.pdf"
  },
  {
    "full_name": "Rosa Niasoff",
    "email": "rosaniasoff@gmail.com",
    "phone": "+972 52-332-2617",
    "whatsapp": "+1 917-603-5931",
    "location": "Jerusalem, Israel",
    "current_job_title": "Esthetician, bookkeeper, social media manager",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education",
      "Healthcare"
    ],
    "tools_software": "Excel, Quickbooks, CRM systems",
    "languages": "English",
    "roles_seeking": "Remote, office manager, entry level bookkeeper, customer service/Administrative Assistant",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/460836_fd1b21162fdc415daf0fbb054cda2718~mv2.png"
  },
  {
    "full_name": "Chanie Drefuss",
    "email": "chaniemeisels18@gmail.com",
    "phone": "+972 53-962-0284",
    "whatsapp": "+44 7863 466309",
    "location": "Israel",
    "current_job_title": "ECommerce",
    "education_level": "Associate's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support"
    ],
    "tools_software": "Adobe photoshop, illustrator, lightroom, excel, word, canva",
    "languages": "English, yidish, hebrew, French, dutch",
    "roles_seeking": "Secretarial",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8fcea3_ec973cae5e6c41a1829278a6a2f5b49c.pdf"
  },
  {
    "full_name": "ShlomoZahn",
    "email": "shlomo@sharpbk.com",
    "phone": "+972 55-330-5817",
    "whatsapp": "+972 55-331-2303",
    "location": "Ramat Eshkol, Israel",
    "current_job_title": "Bookkeeper",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "QBO, Xero, Microsoft Office",
    "languages": "English",
    "roles_seeking": "Bookkeeping",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "40/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1fbf1b_a948002c748741ffa16ed04b8ba2c066.pdf"
  },
  {
    "full_name": "Gedaliah Jawitz",
    "email": "gedaliah@mail.com",
    "phone": "+1 516-882-3479",
    "whatsapp": "+1 516-882-3479",
    "location": "Israel",
    "current_job_title": "Varied",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Several",
    "languages": "English",
    "roles_seeking": "You advertised real estate manager, or others",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "0/hour",
    "currency": "Any",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2f17c7_040aee556ae446b39a1a4eb41a4053f5.pdf"
  },
  {
    "full_name": "Michal Dome",
    "email": "michaldomeschool@gmail.com",
    "phone": "+972 58-455-3645",
    "whatsapp": "+972 58-455-3645",
    "location": "Beit shemesh",
    "current_job_title": "Bnot sherut imstructer",
    "education_level": "Master's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education"
    ],
    "tools_software": "Excel , salesforce ,",
    "languages": "English , Hebrew",
    "roles_seeking": "Secretary , bookeeper",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50/hour",
    "currency": "ILS",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/49632d_cf000d4ac7214af8a66d47375bd17936.docx"
  },
  {
    "full_name": "Shani Dayan",
    "email": "shanihershko18@gmail.com",
    "phone": "+1 818-519-8061",
    "whatsapp": "+1 818-519-8061",
    "location": "Israel",
    "current_job_title": "Surgical assistant/ medical secretary",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Healthcare"
    ],
    "tools_software": "Optima",
    "languages": "English, Hebrew",
    "roles_seeking": "Remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/030dd5_c3343efe23ed4932ac16c1ef57fee519~mv2.jpg"
  },
  {
    "full_name": "Nussey blum",
    "email": "blumnussen@gmail.com",
    "phone": "+972 55-332-7028",
    "whatsapp": "+1 646-655-9266",
    "location": "Jerusalem Israel",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Other"
    ],
    "tools_software": "Slack, basic computer",
    "languages": "Yiddish English",
    "roles_seeking": "Data entry / team manager/ customer service/ flexible hours",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://static.wixstatic.com/media/b2493d_202b7fed01c440eba666f763232429e5~mv2.jpg"
  },
  {
    "full_name": "Shoshana Tahan",
    "email": "shoshanatahambk@gmail.com",
    "phone": "+972 53-367-8325",
    "whatsapp": "+972 53-367-8325",
    "location": "Jerusalem, Israel",
    "current_job_title": "Tutor",
    "education_level": "Associate's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other:"
    ],
    "tools_software": "Google, Microsoft",
    "languages": "Hebrew, English",
    "roles_seeking": "All",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "28/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8d10bb_6080cb255c5347d2864d7b4c940ecdc0.pdf"
  },
  {
    "full_name": "Sharon barylka",
    "email": "sharonbarylka@gmail.com",
    "phone": "+52 56 2099 7088",
    "whatsapp": "+52 56 2099 7088",
    "location": "Mexico City Mexico",
    "current_job_title": "Actuarial mathematics",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "Power BI, Microsoft, CRM",
    "languages": "English, Spanish, Hebrew, Portuguese",
    "roles_seeking": "Accounting, bookkeeping, assistant",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/81e3cd_cc6ac3e9fa6c478cb8a42f08c2df1379.pdf"
  },
  {
    "full_name": "Temima lieba saffer",
    "email": "temimalsaffer@gmail.com",
    "phone": "+27 64 755 3879",
    "whatsapp": "+27 64 755 3879",
    "location": "Johannesburg, South africa",
    "current_job_title": "Student",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Design",
      "Other"
    ],
    "tools_software": "Canva",
    "languages": "English",
    "roles_seeking": "Management",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/51fe07_7b120d10f302488e9598ac7d429938cb.pdf"
  },
  {
    "full_name": "Yitzy",
    "email": "issaclowy18@gmail.com",
    "phone": "+1 929-568-8865",
    "whatsapp": "+1 646-851-1718",
    "location": "Borough park",
    "current_job_title": "Music",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "N/A",
    "languages": "English Yiddish",
    "roles_seeking": "Whatever is offerd",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/12ddba_4ff664d279d840f2a90152782810e620.pdf"
  },
  {
    "full_name": "Rachelli Frankel",
    "email": "rfeldinger2020@gmail.com",
    "phone": "+44 7501 681818",
    "whatsapp": "+44 7501 681818",
    "location": "London, England",
    "current_job_title": "Teacher",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "Microsoft word, excel, PowerPoint, spreadsheets",
    "languages": "English",
    "roles_seeking": "An office role, a real estate worker or something similar.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "18/hour",
    "currency": "Pound",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/02d273_3ac356ac09e2478e92c0e122298949f8.docx"
  },
  {
    "full_name": "rivka Frankel",
    "email": "rivkafrankel1@gmail.com",
    "phone": "+972 53-433-2725",
    "whatsapp": "+1 732-232-8416",
    "location": "ירושלים, Israel",
    "current_job_title": "NA",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Healthcare"
    ],
    "tools_software": "CRM, Spreadsheets, Microsoft Office",
    "languages": "English",
    "roles_seeking": "Office manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d6acf6_31ff9fbd8acd47c0b1e5c8f6aed31962.pdf"
  },
  {
    "full_name": "Zissy Knopfler",
    "email": "zissybla@gmail.com",
    "phone": "+972 58-657-0118",
    "whatsapp": "+44 7756 994550",
    "location": "Jerusalem, Israel",
    "current_job_title": "Secretary to COO of ezras nashim",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Microsoft, CRM",
    "languages": "English",
    "roles_seeking": "Secretary",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "$",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/880595_af644f8710ee4f07adb495c174834953.docx"
  },
  {
    "full_name": "Shlomo Eli Potash",
    "email": "potashshlomo@gmail.com",
    "phone": "+1 347-971-5335",
    "whatsapp": "+1 347-971-5335",
    "location": "Lakewood",
    "current_job_title": "Office mamager",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Microsoft Office 365, Google suite, QuickBooks Online,",
    "languages": "English and Yiddish",
    "roles_seeking": "Office Manager",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "35/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ffca3b_549d32bd64f84e3caaa83c34fad862e1.pdf"
  },
  {
    "full_name": "Leah Jasven",
    "email": "leahjasven@gmail.com",
    "phone": "+1 678-706-9576",
    "whatsapp": "+972 50-750-8249",
    "location": "Johannesburg, South Africa",
    "current_job_title": "Designer",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Design",
      "Education",
      "Tech/Software",
      "Marketing"
    ],
    "tools_software": "Adobe, Microsoft, Canva, Camtasia, html",
    "languages": "English",
    "roles_seeking": "I am open to anything, maybe in graphics, video editing, office work, secretary, recruiting",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/15bffc_65794267f4f84991993a8230c0df74bb.pdf"
  },
  {
    "full_name": "Shira Avramenko",
    "email": "shiralloyd126@gmail.com",
    "phone": "+972 53-333-7907",
    "whatsapp": "+972 53-333-7907",
    "location": "Kiryat Gat",
    "current_job_title": "Office administrator and marketer",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Marketing",
      "Education",
      "Healthcare",
      "Customer Support"
    ],
    "tools_software": "NA",
    "languages": "English, Hebrew",
    "roles_seeking": "Office Manager, online nurse, marketing,customer success, customer support, education, Judaism, Israel, hasbara, teaching",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/986df8_71cdfa5744c644fc86fdb5eec998f3e0.pptx"
  },
  {
    "full_name": "joseph hackenbroch",
    "email": "josephack321@gmail.com",
    "phone": "+972 58-697-0959",
    "whatsapp": "+44 7869 845589",
    "location": "jerusalem",
    "current_job_title": "sudent",
    "education_level": "Master's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Qube, Microsoft Suite",
    "languages": "English, Hebrew",
    "roles_seeking": "Real Estate related",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5a15fe_c721898ddab94a8aa082d1470128e3ae.pdf"
  },
  {
    "full_name": "Stacy Weissenberger",
    "email": "sipora.baron@gmail.com",
    "phone": "+972 52-514-4600",
    "whatsapp": "+972 52-514-4600",
    "location": "Jerusalem,  Israel",
    "current_job_title": "Entrepreneur",
    "education_level": "Associate's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Slack, Shopify, Chat-gpt, Microsoft,  G-suite, Monday, Canva, Meta business suite",
    "languages": "English, Hebrew, Conversational Spanish",
    "roles_seeking": "Customer Success,  data entry, lite graphics, admin, virtual assistant",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "35/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/bcf758_09fed4db5f014120abcd06c3d474dcb3.pdf"
  },
  {
    "full_name": "Nechama Schechter",
    "email": "nperkins1104@gmail.com",
    "phone": "+1 305-409-2536",
    "whatsapp": "+1 305-409-2536",
    "location": "North miami beach",
    "current_job_title": "previously sales and office work",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Customer Support",
      "Other:"
    ],
    "tools_software": "na",
    "languages": "english",
    "roles_seeking": "office",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "usa",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/3a7a41_1e069e8ad7b8401582f195bb327e05aa.pdf"
  },
  {
    "full_name": "Chayim Ashkenazi",
    "email": "chayimashkenazi@gmail.com",
    "phone": "+972 58-403-1989",
    "whatsapp": "+972 58-403-1989",
    "location": "jerusalem, israel",
    "current_job_title": "Sales manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Design",
      "Education"
    ],
    "tools_software": "Canva, Google suite, instagram.",
    "languages": "English Hebrew Turkish",
    "roles_seeking": "Property management, marketing, customer experience",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ed9d68_2c65c420dfb64ca590dfa29b748f664b.pdf"
  },
  {
    "full_name": "Daniel Posen",
    "email": "danielposen31@gmail.com",
    "phone": "+972 50-279-9949",
    "whatsapp": "+44 7751 163389",
    "location": "London",
    "current_job_title": "Unemployed, Part time student",
    "education_level": "Master's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Excel, Canva, Arthur, Inventory Hive",
    "languages": "English",
    "roles_seeking": "Client facing, not limited",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/2933f9_f0236f89870346a786117f1e59d3ff46.pdf"
  },
  {
    "full_name": "Daniella Brown",
    "email": "daniellashnider@yahoo.com",
    "phone": "+972 53-495-8293",
    "whatsapp": "+1 818-318-7920",
    "location": "Jerusalem,",
    "current_job_title": "N/a",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Customer Support",
      "Other"
    ],
    "tools_software": "Google sheets, excel, Microsoft",
    "languages": "English and Hebrew",
    "roles_seeking": "Office manager, Bookkeeping, data entry, secretary",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "18/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b6888a_39c519701e074bba8a814b4aa7afbac8.pdf"
  },
  {
    "full_name": "Hadassah Sofer",
    "email": "hpieprz@gmail.com",
    "phone": "+972 58-788-6855",
    "whatsapp": "+972 58-788-6855",
    "location": "petach tikva",
    "current_job_title": "Data analyst",
    "education_level": "Associate's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Customer Support",
      "Education",
      "Healthcare",
      "Other"
    ],
    "tools_software": "Python SQL MS office database director manager time sensitive high stress",
    "languages": "English Hebrew",
    "roles_seeking": "Data analyst, bookkeeper, office manager",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/d47615_e825b39361c644deb6ce85aab259e121~mv2.jpg"
  },
  {
    "full_name": "Joshua Wegodsky",
    "email": "jmwegodsky@gmail.com",
    "phone": "+1 732-210-7035",
    "whatsapp": "+1 732-210-7035",
    "location": "Highland Park, NJ",
    "current_job_title": "Mashgiach",
    "education_level": "Associate's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Excel, quickbooks, gsuites,",
    "languages": "English",
    "roles_seeking": "Bookkeeping entry level",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/0bcaa2_a7ad5fce2a664678b9da37f8d8bfb30e.docx"
  },
  {
    "full_name": "Naomi Goldstein",
    "email": "brachagolds@gmail.com",
    "phone": "+1 929-482-7778",
    "whatsapp": "+1 929-482-7778",
    "location": "Staten Island, New York  United States",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "N/A",
    "languages": "English, Yiddish",
    "roles_seeking": "Customer service",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/938e25_3ff0739e99784296a199dc56c195224f.docx"
  },
  {
    "full_name": "Chavi Markovitz",
    "email": "chaviwarshawsky@gmail.com",
    "phone": "+44 7914 712864",
    "whatsapp": "+44 7914 712864",
    "location": "Jerusalem, Israel",
    "current_job_title": "NA",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Healthcare"
    ],
    "tools_software": "Microsoft, Canva, ChatGPT",
    "languages": "English",
    "roles_seeking": "Office management",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "20/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/6476b7_a5e4d8115a8f47b183883530d70433bc.pdf"
  },
  {
    "full_name": "Shalom Levy",
    "email": "shalomlevy7@gmail.com",
    "phone": "+972 58-527-7180",
    "whatsapp": "+972 58-527-7180",
    "location": "Jerusalem",
    "current_job_title": "Real Estate Manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education",
      "Healthcare",
      "Other"
    ],
    "tools_software": "Basic",
    "languages": "English,  Hebrew",
    "roles_seeking": "Sales, Marketing, Real Estate",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7b25b5_5857fe596c45467eae5b94c5aa6baccb.pdf"
  },
  {
    "full_name": "Sarah Gozal",
    "email": "gozalsarah@gmail.com",
    "phone": "+972 58-411-0037",
    "whatsapp": "+972 58-411-0037",
    "location": "Jerusalem Israel",
    "current_job_title": "Office Manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Marketing"
    ],
    "tools_software": "Python , Salesforce, Monday.com, Microsoft, Canva",
    "languages": "English, Spanish, French",
    "roles_seeking": "Office manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "19/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/0dd1a1_4c91e88ce1bd424eaa49ab4234465f0d.pdf"
  },
  {
    "full_name": "Yehoudit Levy",
    "email": "yehouditlevy@hotmail.com",
    "phone": "+972 58-487-9855",
    "whatsapp": "+972 58-487-9855",
    "location": "Tzfat",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support",
      "Education"
    ],
    "tools_software": "Excel, Word, different fundraising softwares",
    "languages": "English, French and Hebrew",
    "roles_seeking": "I am flexible and adaptable to any interesting part-time remote job",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "18/hour",
    "currency": "$",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5f7acd_8ca13ae27d6d40d289dcca89458a61b4.docx"
  },
  {
    "full_name": "Michal Kaufman",
    "email": "michalkaufman01@gmail.com",
    "phone": "+44 7368 466412",
    "whatsapp": "+44 7368 466412",
    "location": "United Kingdom,London",
    "current_job_title": "na",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education"
    ],
    "tools_software": "excel etc",
    "languages": "english",
    "roles_seeking": "healthcare helping people etc",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "15/hour",
    "currency": "£",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/777411_3a8d7611d2ad4550bf2a559839301762.pdf"
  },
  {
    "full_name": "Chaim Andrusier",
    "email": "candrusier@gmail.com",
    "phone": "+972 53-351-5344",
    "whatsapp": "+972 53-351-5344",
    "location": "Jerusalem",
    "current_job_title": "Business Development Manager",
    "education_level": "Master's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Tech/Software",
      "Design",
      "Healthcare"
    ],
    "tools_software": "Excel, SQL, Powerpoint, Canva, AI Tools",
    "languages": "English, Hebrew",
    "roles_seeking": "Financial Analysis, Underwriting, Business Development,",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "60000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c5820e_b29ea3821fae40b7ad18d16422374c25.pdf"
  },
  {
    "full_name": "Albert Kagan",
    "email": "barukhkagan@proton.me",
    "phone": "+1 732-451-4990",
    "whatsapp": "+972 53-483-7742",
    "location": "Jerusalem, Israel",
    "current_job_title": "Digital Marketer",
    "education_level": "Associate's Degree",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education"
    ],
    "tools_software": "Google Marketing Platform, Quickbooks Online",
    "languages": "English",
    "roles_seeking": "Digital Marketer, Junior Bookkeeper",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/55fa29_2619903dfb224f77bedc0a5fbb009202.pdf"
  },
  {
    "full_name": "Sarah Pasternak",
    "email": "michalpasternak18@gmail.com",
    "phone": "+1 732-956-4432",
    "whatsapp": "+1 732-956-4432",
    "location": "New Jersey",
    "current_job_title": "Junior bookkeeper remote",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Marketing",
      "Design"
    ],
    "tools_software": "Na",
    "languages": "English",
    "roles_seeking": "Junior bookkeeper",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "18/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8d73d5_79eddda45ba144dcbca2dd9501f8aa7f.pdf"
  },
  {
    "full_name": "Lynn Dahan",
    "email": "lynndahan@gmail.com",
    "phone": "+1 972-768-8033",
    "whatsapp": "+1 972-768-8033",
    "location": "Jerusalem, Israel",
    "current_job_title": "Not working currently but the latest job I had was a financial assistant for a accessibilities specialist/architect",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Healthcare",
      "Education"
    ],
    "tools_software": "Slack, Microsoft office suite, excel, google workspace, quickbooks, Microsoft teams, notion, zoom, canva",
    "languages": "English and Hebrew",
    "roles_seeking": "Property management, Real Estate Assistant, Administrative Assistant – Real Estate, Transaction Coordinator, Leasing Assistant, Office Coordinator (Real Estate Office), Real Estate Operations Assistant, Marketing Assistant (Real Estate), Real Estate Social Media Coordinator, Accounts Payable (AP) Specialist, Accounts Receivable (AR) Specialist, Bookkeeper, Payroll Assistant / Specialist Billing Coordinator, Property Accountant, Real Estate Accounting, Assistant Lease Administrator (with accounting duties) Accounts Payable – Property Management",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/33191d_55f47baf505245f4a59eda6c5431cf6b.pdf"
  },
  {
    "full_name": "Jonathan Sebbag",
    "email": "j.sebbag15@gmail.com",
    "phone": "+1 972-338-0867",
    "whatsapp": "+1 972-338-0867",
    "location": "Dallas, TX USA",
    "current_job_title": "Executive Administrator",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Tech/Software",
      "Other"
    ],
    "tools_software": "Microsoft Office, Adobe PDF, Orgmeter, Excel",
    "languages": "English, French",
    "roles_seeking": "Any",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "80000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/3b47f9_211f758dc61544ddb39d45e2da9be5d1.pdf"
  },
  {
    "full_name": "Rivka Abramov",
    "email": "rivkabramov7@gmail.com",
    "phone": "+972 52-471-6728",
    "whatsapp": "+1 516-451-2741",
    "location": "Jerusalem",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Customer Support",
      "Education"
    ],
    "tools_software": "None",
    "languages": "English, Hebrew",
    "roles_seeking": "Entry level",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ad80d9_07d10896b11e4913b382dceacc39330f.pdf"
  },
  {
    "full_name": "Meital Cherro",
    "email": "meitalcherro@gmail.com",
    "phone": "+972 58-687-6737",
    "whatsapp": "+972 58-687-6737",
    "location": "Israel, Efrat",
    "current_job_title": "Sales associate",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education"
    ],
    "tools_software": "Microsoft office, google workspace, slack",
    "languages": "Spanish, english, hebrew",
    "roles_seeking": "A remote job",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "18/hour",
    "currency": "$",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1be45b_6538e09f081045df9e90047bace3847e.pdf"
  },
  {
    "full_name": "Gitty Mayteles",
    "email": "gittyrosental@gmail.com",
    "phone": "+972 52-500-4300",
    "whatsapp": "+44 7940 992409",
    "location": "Jerusalem",
    "current_job_title": "Office manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [],
    "tools_software": "Microsoft Office, Slack, Canva,",
    "languages": "English, Hebrew, French, Yiddish, Dutch",
    "roles_seeking": "flexible, remote, administrative work, working with people",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "$",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/fb7f42_48b2bfc85b704ecbbed553d67d806292.pdf"
  },
  {
    "full_name": "Shani Shain",
    "email": "shanis05@icloud.com",
    "phone": "+972 53-573-0910",
    "whatsapp": "+972 53-573-0910",
    "location": "Jerusalem israel",
    "current_job_title": "National service volunteer",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare",
      "Other"
    ],
    "tools_software": "Google docs, canva, can manage an excel spreadsheet",
    "languages": "English, proficiency in Hebrew",
    "roles_seeking": "Manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ea7aa1_d5d0f332d8ac4849994863f5dee55185.docx"
  },
  {
    "full_name": "Shaani  papich",
    "email": "shaanipapich06@gmail.com",
    "phone": "+972 50-212-1554",
    "whatsapp": "+972 50-212-1554",
    "location": "Jerusalem",
    "current_job_title": "Office job",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Healthcare"
    ],
    "tools_software": "Office",
    "languages": "Hebrew English",
    "roles_seeking": "Management",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "15/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/dd57ff_e5999a161da848cc8d001ddb1edd5f22.docx"
  },
  {
    "full_name": "Jessica Menashe",
    "email": "jessicaburgh@gmail.com",
    "phone": "+1 646-796-5703",
    "whatsapp": "+1 646-796-5703",
    "location": "BeerSheva/Miami",
    "current_job_title": "Cybersecurity Analyst",
    "education_level": "Master's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Customer Support",
      "Education"
    ],
    "tools_software": "Python",
    "languages": "English and Hebrew",
    "roles_seeking": "Cybersecurity",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "80000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/13c144_4a282a864fd54dc29dcc3b682ed83e62~mv2.jpeg"
  },
  {
    "full_name": "Assaf Menashe",
    "email": "menasheasaf@gmail.com",
    "phone": "+1 929-316-2221",
    "whatsapp": "+1 929-316-2221",
    "location": "Beersheba/Miami",
    "current_job_title": "Support Specialist",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Customer Support",
      "Healthcare"
    ],
    "tools_software": "Slack, Jira, Monday , Directory",
    "languages": "English and Hebrew",
    "roles_seeking": "Tech Support, Customer Success, Office Manager, onboarding, etc’",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/13c144_dd66342bbfa849c98951393a81658eeb.pdf"
  },
  {
    "full_name": "Nasanel Cohen",
    "email": "nasanelcohen18@gmail.com",
    "phone": "+1 347-940-6874",
    "whatsapp": "+1 347-940-6874",
    "location": "Toronto,Canada",
    "current_job_title": "Unemployed",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Remote landlord,google docs",
    "languages": "English,Hebrew,Yiddish",
    "roles_seeking": "Remote",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f64d3e_8a2cc00352a04bde8cfb03375eb5b847.pdf"
  },
  {
    "full_name": "Estee Teich",
    "email": "esteeteich1@gmail.com",
    "phone": "+1 917-855-5607",
    "whatsapp": "+1 917-855-5607",
    "location": "Tel Aviv, Israel (in NY right now)",
    "current_job_title": "Unemployed",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Healthcare",
      "Other:"
    ],
    "tools_software": ".",
    "languages": "English",
    "roles_seeking": ".",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "27/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/3fd5c3_cd1a7d674f5846818bdb7c071889549f.docx"
  },
  {
    "full_name": "Aaron Gross",
    "email": "aarongross5286@gmail.com",
    "phone": "+1 202-905-9778",
    "whatsapp": "+1 240-630-0289",
    "location": "Silver Spring, Maryland",
    "current_job_title": "Unemployed - Analyst",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Maltego",
    "languages": "English, some Hebrew, some Arabic, some Persian",
    "roles_seeking": "Jobs that will make good use of my skills",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "100000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/972b35_7f47c4dbdc1d4c52ae322f1b74c2c6bd.docx"
  },
  {
    "full_name": "Sara katz",
    "email": "sarakatz400@gmail.com",
    "phone": "+1 929-234-8227",
    "whatsapp": "+1 929-234-8227",
    "location": "United States",
    "current_job_title": "Operations coordinator",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Other:",
      "Design",
      "Education",
      "Healthcare",
      "Customer Support",
      "Marketing"
    ],
    "tools_software": "Enterprise /canva /sharepoint /",
    "languages": "English Yiddish Hebrew",
    "roles_seeking": "Digital art design… etc",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "30/hour",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/6ba2af_5a4850ae7f1a4d69a56b4c5f67e39e57~mv2.jpeg"
  },
  {
    "full_name": "Nachie Samuels",
    "email": "nachiesamuels@gmail.com",
    "phone": "+1 347-413-2822",
    "whatsapp": "+1 347-413-2822",
    "location": "Brooklyn",
    "current_job_title": "Fiscal Intermediary",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Customer Support",
      "Healthcare"
    ],
    "tools_software": "Medisked, Mainsl, Empeon, WireShark, Linux",
    "languages": "English",
    "roles_seeking": "Ideally, a position in tech, but I am open to other administrative roles.",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "100000/year",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f1f4b2_990d937fb546461e842eb9dafc194def.pdf"
  },
  {
    "full_name": "Mendy Lewis",
    "email": "lewismendy@gmail.com",
    "phone": "+1 718-755-4268",
    "whatsapp": "+1 718-755-4268",
    "location": "kingston PA",
    "current_job_title": "security/low voltage lead tech",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Tech/Software",
      "Customer Support",
      "Other"
    ],
    "tools_software": "CCTV VMS systems, access control , data networks",
    "languages": "Hebrew, english",
    "roles_seeking": "project manager, systems design",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "120000/year",
    "currency": "$",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/5cc5be_60da5c3b98ff4104a30595c9c43db516.pdf"
  },
  {
    "full_name": "Batsheva banayan",
    "email": "bat7ban@gmail.com",
    "phone": "+1 347-785-0852",
    "whatsapp": "+1 347-785-0852",
    "location": "Usa",
    "current_job_title": "Full Charge Bookkeeper",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Healthcare",
      "Other"
    ],
    "tools_software": "Many see resume",
    "languages": "English, hebrew",
    "roles_seeking": "Bookkeeper",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "85000/year",
    "currency": "Usa",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/f33c00_7ffbcdbb88174d438e4e14ecd5f3fd45.pdf"
  },
  {
    "full_name": "AARON LEIB STONE",
    "email": "als5770@gmail.com",
    "phone": "+1 718-613-0642",
    "whatsapp": "+1 917-333-0770",
    "location": "BROOKLYN",
    "current_job_title": "physician",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Healthcare",
      "Customer Support"
    ],
    "tools_software": "email, medical telehealth",
    "languages": "english",
    "roles_seeking": "could be healthcare, consulting, customer service",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "0/hour",
    "currency": "$",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4d8a27_9674616b79024fa48bda3e750d087d73.pdf; https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4d8a27_bcdad2688b0047cfac75139b760be695.pdf"
  },
  {
    "full_name": "Menachem mendel bezyma",
    "email": "marik97@hotmail.de",
    "phone": "+380 98 367 1650",
    "whatsapp": "+380 98 367 1650",
    "location": "Ukraine Uzhogod",
    "current_job_title": "Lost my job cuz of the war",
    "education_level": "High School / GED",
    "years_experience": "0–1 year",
    "fields_worked_in": [],
    "tools_software": "Ready to learn what’s needed",
    "languages": "English German Russian",
    "roles_seeking": "Any I need a job asap ready to learn what’s needed and will put all effort into it the CV is not updated but will just try it and hope for the best",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "18/hour",
    "currency": "Euro",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://static.wixstatic.com/media/80d9d0_d9ec1bc308f74a92a76d21253f116e20~mv2.png"
  },
  {
    "full_name": "Eliau Mainemer",
    "email": "emaineme@mail.yu.edu",
    "phone": "+52 56 4918 0571",
    "whatsapp": "+52 56 4918 0571",
    "location": "United States",
    "current_job_title": "Junior Campaign Assistant",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing"
    ],
    "tools_software": "Asana,  Microsoft Office, Google Workspace, Zoom, Linkedin,  Meta Ads, Instagram, Facebook",
    "languages": "Spanish,  English",
    "roles_seeking": "Case manager, Account Manager,  admin...",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/6081bf_8d862e43e482496eb015e617fef70669.pdf"
  },
  {
    "full_name": "Perel Roth",
    "email": "perelroth@hotmail.com",
    "phone": "+1 917-216-5086",
    "whatsapp": "+1 917-216-5086",
    "location": "Brooklyn",
    "current_job_title": "Bookkeeper",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Design",
      "Education"
    ],
    "tools_software": "QB desktop, QB Online, excel",
    "languages": "English",
    "roles_seeking": "Bookkeeper",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50000/year",
    "currency": "USD",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1af236_eeedede515694b9aa4ec45ebd176c839.pdf"
  },
  {
    "full_name": "David Silberstein",
    "email": "rodalsjudaica@gmail.com",
    "phone": "+1 514-358-0440",
    "whatsapp": "+1 514-733-2876",
    "location": "Montreal",
    "current_job_title": "Bookkeeper",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Quickbooks",
    "languages": "English, yiddish, Hebrew",
    "roles_seeking": "Bookkeeping",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "40/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b704f0_16574095785c4a399e942301466c7e6f.pdf"
  },
  {
    "full_name": "Dina Schneider",
    "email": "floodetjie@yahoo.com.au",
    "phone": "+27 83 586 8615",
    "whatsapp": "+27 83 586 8615",
    "location": "Johannesburg, South Africa",
    "current_job_title": "Admin Support",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "Microsoft Excel, Word",
    "languages": "English",
    "roles_seeking": "Admin Support / Data Entry",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ed4b7c_acc30669f0e346208c746c2aaf0f56d9.pdf"
  },
  {
    "full_name": "Chaim Schneider",
    "email": "chaimsch@gmail.com",
    "phone": "+27 76 652 3059",
    "whatsapp": "+27 76 652 3059",
    "location": "Johannesburg, South Africa",
    "current_job_title": "Head of Key Accounts and Corporate Clients Manager",
    "education_level": "High School / GED",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support"
    ],
    "tools_software": "Excel, Internal company CRM",
    "languages": "English",
    "roles_seeking": "Customer Relations / Sales",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "45/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ed4b7c_f6f9c30ffab34640bfe2b89a7e5bff13.pdf"
  },
  {
    "full_name": "Nissan yomtov",
    "email": "nissiyomtov@gmail.com",
    "phone": "+1 347-620-6134",
    "whatsapp": "+1 347-620-6134",
    "location": "Brooklyn ny",
    "current_job_title": "Lead care coordinator",
    "education_level": "High School / GED",
    "years_experience": "3–5 years",
    "fields_worked_in": [
      "Healthcare",
      "Design",
      "Marketing"
    ],
    "tools_software": "Excelle, crm, Apolloi",
    "languages": "English Hebrew Yiddish",
    "roles_seeking": "Managemnt healthcare evening hours",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "35/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/b66cc4_4bca105ca7714085b8b811784998df14.pdf"
  },
  {
    "full_name": "Kalil Shmuel (Kyle) Zaldin",
    "email": "kylesz@outlook.com",
    "phone": "+972 53-380-2419",
    "whatsapp": "+972 53-380-2419",
    "location": "Jerusalem, Israel",
    "current_job_title": "social work student/intern, night seder rebbi",
    "education_level": "Master's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Google Workspace, Microsoft Office",
    "languages": "English, Hebrew",
    "roles_seeking": "Administrative, education, counselling",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "50/hour",
    "currency": "ILS",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ab334e_dd314454f8e8498c8b73188a61f26430.pdf"
  },
  {
    "full_name": "Joshua Lipinsky",
    "email": "jmlipinsky@gmail.com",
    "phone": "+972 54-883-5972",
    "whatsapp": "+972 54-883-5972",
    "location": "Beit shemesh Israel",
    "current_job_title": "Manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Office, Final Cut Studio , Mac OS",
    "languages": "English",
    "roles_seeking": "Management",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/fff9a7_e955039aac544d8ab0fe3794a313af2b.docx"
  },
  {
    "full_name": "Yehezkel Markovitch",
    "email": "ypmarkovitch@gmail.com",
    "phone": "+1 770-810-5460",
    "whatsapp": "+1 770-810-5460",
    "location": "New York",
    "current_job_title": "Software engineer",
    "education_level": "Bachelor's Degree",
    "years_experience": "0–1 year",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "Python JavaScript React",
    "languages": "English Hebrew Russian Ukrainian",
    "roles_seeking": "Entry level software engineer",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "45/hour",
    "currency": "USD",
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/617d48_6871ddb6c9bb459da53dc531306f39d3.pdf"
  },
  {
    "full_name": "Yael Schottenstein",
    "email": "yaschott@gmail.com",
    "phone": "+972 52-594-0021",
    "whatsapp": "+972 52-594-0021",
    "location": "Jerusalem",
    "current_job_title": "Public healthcare nurse but previously worked four years in customer service",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Healthcare",
      "Other"
    ],
    "tools_software": "Slack, Sap, Microsoft",
    "languages": "English and Hebrew",
    "roles_seeking": "Customer support, medical device, advocacy for olim",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "90/hour",
    "currency": "ILS",
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/388ede_7386b709a8f74ee78237500c3e5550aa.pdf"
  },
  {
    "full_name": "NOACH OVADYA",
    "email": "markwil56@gmail.com",
    "phone": "+972 53-980-7232",
    "whatsapp": "+972 53-980-7232",
    "location": "TZFAT",
    "current_job_title": "Project manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Education",
      "Other"
    ],
    "tools_software": "Microsoft Word, Excel",
    "languages": "English",
    "roles_seeking": "I'm flexible to whatever is needed",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "25",
    "currency": null,
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7ba328_8e02cc52f27043348b464625b55b0521.pdf"
  },
  {
    "full_name": "Sarah Bergstein",
    "email": "saralabergstein@gmail.com",
    "phone": "+1 929-619-9373",
    "whatsapp": "+1 347-479-8853",
    "location": "Israel",
    "current_job_title": "None",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Customer Support"
    ],
    "tools_software": "Google docs, email, word",
    "languages": "English, Hebrew",
    "roles_seeking": "Remote management/ coordination roles",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "30",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/e5f48c_b019f61514934ba8808500774b0caff0.pdf"
  },
  {
    "full_name": "Marisa Tuchinsky",
    "email": "dmtuchinsky@gmail.com",
    "phone": "+972 58-640-5055",
    "whatsapp": "+972 58-640-5055",
    "location": "Beitar Illit",
    "current_job_title": "Work virtually",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Healthcare"
    ],
    "tools_software": "word, excel",
    "languages": "English",
    "roles_seeking": "Virtual work from home. I am organized and work efficiently",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "4",
    "currency": null,
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/c5c257_13c8456555274612965e417cd5a0175d.doc"
  },
  {
    "full_name": "Aviva Shimshon",
    "email": "avivashimshon@gmail.com",
    "phone": "+1 347-439-2619",
    "whatsapp": "+1 347-439-2619",
    "location": "Brooklyn, NY",
    "current_job_title": "Real Estate Lead Generator",
    "education_level": "Master's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Other"
    ],
    "tools_software": "MS Word, Canva, Social Media, etc",
    "languages": "English, French, Italian",
    "roles_seeking": "Sales, client management, HR, other",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "40",
    "currency": null,
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/a0c9ac_c59565ebc96649e18ab3dbf0230339bd.pdf"
  },
  {
    "full_name": "Ivan Babinzski",
    "email": "ibabinzski@gmail.com",
    "phone": "+852 9679 8204",
    "whatsapp": "+852 9679 8204",
    "location": "HongKong, HongKong SAR",
    "current_job_title": "Head of sales/Property consulting",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Marketing",
      "Design",
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Adobe CS, MS Office, CRM",
    "languages": "English, Mandarin Chinese, Russian, Spanish",
    "roles_seeking": "Sales, marketing, management",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "50",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/d316e5_1e9329e1b31b4ecc930e59428ea8fce6.pdf"
  },
  {
    "full_name": "Levi Lebowitz",
    "email": "levilebowitz@gmail.com",
    "phone": "+1 617-678-8420",
    "whatsapp": "+972 53-277-2649",
    "location": "Kfar Vradim/Tzfat Israel",
    "current_job_title": "Real Estate Agent/property manager",
    "education_level": "Bachelor's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software",
      "Marketing",
      "Design",
      "Other"
    ],
    "tools_software": "Excel, RE Manager tools",
    "languages": "English",
    "roles_seeking": "Property Manager",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/1ea353_5dc55ce13555460ba57772ddab65787f.pdf"
  },
  {
    "full_name": "Mendy Goldberg",
    "email": "mendygold92@gmail.com",
    "phone": "+1 347-210-2284",
    "whatsapp": "+1 347-210-2284",
    "location": "brooklyn, CH",
    "current_job_title": "Accountant",
    "education_level": "Master's Degree",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Education",
      "Other"
    ],
    "tools_software": "Quick books, intuit, excel etc",
    "languages": "English, hebrew. Yiddish",
    "roles_seeking": "Part time, not during regular 10-6 work hours",
    "employment_type": [
      "Part Time"
    ],
    "desired_salary": "35",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/255580_d16f2365cdc34e3ab84f7949a870874f.pdf"
  },
  {
    "full_name": "Moshe Rubin",
    "email": "mrubin770@gmail.com",
    "phone": "+1 347-439-9413",
    "whatsapp": "+1 347-439-9413",
    "location": "Brooklyn NY USA",
    "current_job_title": "N/A",
    "education_level": "Bachelor's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Customer Support",
      "Education",
      "Other"
    ],
    "tools_software": "Quick books,Shopify POS",
    "languages": "English",
    "roles_seeking": "Administration, management",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "45",
    "currency": null,
    "us_hours_comfortable": false,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/8c88d2_dc2f368d4cf144e39c8e606c5b4aecf8.pdf"
  },
  {
    "full_name": "Mendel Minkowicz",
    "email": "mminkowicz@gmail.com",
    "phone": "+1 678-612-8355",
    "whatsapp": "+1 678-612-8355",
    "location": "Daytona Beach Florida",
    "current_job_title": "Software Consultant",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Tech/Software"
    ],
    "tools_software": "Salesforce HubSpot, ClickUp, asana , all kinds of CRM",
    "languages": "English",
    "roles_seeking": "Manager, consultant, any type of job",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "25",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/ef84c5_d7036951f3194805a3dad9c63f974447.docx"
  },
  {
    "full_name": "Shmulik Serebryanski",
    "email": "shmuliwithak@gmail.com",
    "phone": "+1 909-521-1213",
    "whatsapp": "+1 909-521-1213",
    "location": "Brooklyn",
    "current_job_title": "Manager",
    "education_level": "High School / GED",
    "years_experience": "1–2 years",
    "fields_worked_in": [
      "Design",
      "Customer Support",
      "Healthcare",
      "Other"
    ],
    "tools_software": "Non",
    "languages": "English, Yiddish",
    "roles_seeking": "Managerial",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "65",
    "currency": null,
    "us_hours_comfortable": false,
    "remote_experience": false,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/7930ba_fd11d859dc5a40df9cdad5161034180d.pdf"
  },
  {
    "full_name": "Shmuli Evers",
    "email": "shmuli@gmail.com",
    "phone": "+1 718-514-7016",
    "whatsapp": "+1 347-661-7294",
    "location": "Brooklyn",
    "current_job_title": "UX Design",
    "education_level": "Associate's Degree",
    "years_experience": "6–10 years",
    "fields_worked_in": [
      "Design"
    ],
    "tools_software": "Figma, Adobe Suite",
    "languages": "English, Dutch, Hebrew & Yiddish",
    "roles_seeking": "lead or Senior role",
    "employment_type": [
      "Full Time"
    ],
    "desired_salary": "150000",
    "currency": null,
    "us_hours_comfortable": true,
    "remote_experience": true,
    "resume_url": "https://6cde8886-fcd8-4a4a-a5b5-62e52637d0d9.usrfiles.com/ugd/4e7b89_84b77a3dba3449dfa9c8366c44174d98.pdf"
  }
] as const

export async function GET(req: Request) {
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  if (secret !== process.env.IMPORT_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let created = 0, skipped = 0, errors: string[] = []

  for (const candidate of CANDIDATES) {
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email: candidate.email,
      email_confirm: true,
      user_metadata: { full_name: candidate.full_name, role: 'candidate' },
    })

    if (authError) {
      if (/already registered/i.test(authError.message)) { skipped++; continue }
      errors.push(`${candidate.email}: ${authError.message}`)
      continue
    }

    const { error: profileError } = await supabase.from('candidate_profiles').upsert({
      id: userData.user.id,
      ...candidate,
      status: 'active',
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      errors.push(`${candidate.email} profile: ${profileError.message}`)
    } else {
      created++
    }

    // Brief pause every 20 to respect rate limits
    if (created % 20 === 0) await new Promise(r => setTimeout(r, 300))
  }

  return Response.json({ created, skipped, errors: errors.slice(0, 20), total: CANDIDATES.length })
}
