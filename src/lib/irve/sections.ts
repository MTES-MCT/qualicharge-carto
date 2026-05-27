import type { QualichargeEVSEConsolidated } from "@/types/irve";

export type DetailItem = {
  label: string;
  rawValue: string | null | undefined;
  copyable?: boolean;
};

export type DetailSection = {
  title: string;
  items: DetailItem[];
};

export function buildSections(station: QualichargeEVSEConsolidated): DetailSection[] {
  return [
    {
      title: "Identité",
      items: [
        { label: "Adresse", rawValue: station.adresse_station, copyable: true },
        { label: "Coordonnées", rawValue: station.coordonneesXY, copyable: true },
        { label: "Enseigne", rawValue: station.nom_enseigne },
        { label: "Implantation", rawValue: station.implantation_station },
        { label: "Code INSEE", rawValue: station.code_insee_commune, copyable: true },
        { label: "Restriction gabarit", rawValue: station.restriction_gabarit },
      ],
    },
    {
      title: "Recharge",
      items: [
        // {
        //   label: "Raccordement",
        //   rawValue: station.raccordement === Raccordement.DIRECT ? "Direct" : "Indirect",
        // },
        { label: "Puissance max par PDC", rawValue: `${station.summary.max_power} kW` },
        // { label: "Puissance totale station", rawValue: `${station.summary.total_power} kW` },
        { label: "Nombre de PDC", rawValue: String(station.pdcs.length) },
        // { label: "Numéro PDL", rawValue: station.num_pdl, copyable: true },
        { label: "Cable T2 attache", rawValue: String(station.cable_t2_attache ?? null) },
        { label: "Station deux-roues", rawValue: String(station.station_deux_roues) },
      ],
    },
    {
      title: "Acces et paiement",
      items: [
        { label: "Condition d'acces", rawValue: station.condition_acces },
        { label: "Horaires", rawValue: station.horaires },
        { label: "Tarification", rawValue: station.tarification },
        { label: "Reservation", rawValue: String(station.reservation) },
        { label: "Accessibilite PMR", rawValue: station.accessibilite_pmr },
      ],
    },
    {
      title: "Exploitation et suivi",
      items: [
        { label: "Opérateur", rawValue: station.nom_operateur },
        { label: "Contact opérateur", rawValue: station.contact_operateur, copyable: true },
        { label: "Telephone opérateur", rawValue: station.telephone_operateur, copyable: true },
        // { label: "Aménageur", rawValue: station.nom_amenageur },
        { label: "Contact aménageur", rawValue: station.contact_amenageur, copyable: true },
        { label: "SIREN aménageur", rawValue: station.siren_amenageur, copyable: true },
        { label: "Mise en service", rawValue: station.date_mise_en_service },
        { label: "Dernière mise à jour", rawValue: station.date_maj },
        { label: "Observations", rawValue: station.observations },
      ],
    },
    {
      title: "Identifiants",
      items: [
        { label: "ID station itinerance", rawValue: station.id_station_itinerance, copyable: true },
        { label: "ID station local", rawValue: station.id_station_local, copyable: true },
      ],
    },
  ];
}
