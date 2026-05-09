export interface Persona {
  id: string;
  label: string;
  zone: string;
  stratum: number;
  home_type: string;
  household_size: number;
  work_pattern: string;
  usage_profile: string;
  expected_water_m3: [number, number];
  expected_energy_kwh: [number, number];
  expected_gas_m3: [number, number];
}
