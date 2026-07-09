export interface IndiaState {
  name: string;
  cities: string[];
}

export const INDIA_STATES: IndiaState[] = [
  { name: "Andhra Pradesh", cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Kakinada", "Rajahmundry"] },
  { name: "Bihar", cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Arrah"] },
  { name: "Chhattisgarh", cities: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"] },
  { name: "Delhi", cities: ["New Delhi", "Delhi"] },
  { name: "Goa", cities: ["Panaji", "Vasco da Gama", "Margao"] },
  { name: "Gujarat", cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Anand", "Bharuch", "Morbi"] },
  { name: "Haryana", cities: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Sonipat", "Rohtak", "Hisar", "Karnal", "Bhiwani", "Manesar"] },
  { name: "Himachal Pradesh", cities: ["Shimla", "Dharamshala", "Solan", "Mandi", "Baddi"] },
  { name: "Jharkhand", cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"] },
  { name: "Karnataka", cities: ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belagavi", "Kalaburagi", "Davangere", "Tumkur", "Hosur"] },
  { name: "Kerala", cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Malappuram", "Alappuzha"] },
  { name: "Madhya Pradesh", cities: ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Pithampur"] },
  { name: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Thane", "Navi Mumbai", "Kolhapur", "Amravati", "Bhiwandi", "Vasai-Virar"] },
  { name: "Odisha", cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"] },
  { name: "Punjab", cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Phagwara"] },
  { name: "Rajasthan", cities: ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bhiwadi", "Neemrana"] },
  { name: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Tiruppur", "Vellore", "Hosur", "Ambattur"] },
  { name: "Telangana", cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Secunderabad", "Sangareddy"] },
  { name: "Uttar Pradesh", cities: ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi", "Allahabad", "Noida", "Greater Noida", "Mathura", "Aligarh", "Bareilly", "Moradabad", "Gorakhpur"] },
  { name: "Uttarakhand", cities: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh"] },
  { name: "West Bengal", cities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Haldia", "Kharagpur"] },
];

export const ALL_CITIES = INDIA_STATES.flatMap((s) => s.cities).sort();
