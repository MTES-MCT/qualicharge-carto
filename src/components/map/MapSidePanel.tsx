"use client";

import type { ReactNode } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";

interface MapSidePanelProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  stationContact?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  bodyClassName?: string;
  labelledById?: string;
  headerPicture?: string | null;
  headerPictureHref?: string | null;
}

export function MapSidePanel({
  id,
  isOpen,
  onClose,
  title,
  subtitle,
  eyebrow,
  stationContact,
  children,
  className = "",
  contentClassName = "",
  bodyClassName = "",
  labelledById,
  headerPicture,
  headerPictureHref,
}: MapSidePanelProps) {
  const titleId = labelledById ?? `${id}-title`;

  return (
    <aside
      id={id}
      className={`absolute inset-0 z-[1200] pointer-events-none ${className ? ` ${className}` : ""}`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute top-0 left-0 bottom-0 w-[var(--irve-map-panel-width)] bg-white text-slate-800 flex flex-col overflow-hidden pointer-events-auto transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isOpen ? "translate-x-0" : "-translate-x-full"}${contentClassName ? ` ${contentClassName}` : ""}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
      >
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center gap-3">
            {headerPicture ? (
              <div className="relative shrink-0 self-center">
                <img
                  src={headerPicture}
                  alt={`Photographie de ${title}`}
                  className="h-24 w-24 rounded-lg object-cover"
                />
                {headerPictureHref ? (
                  <div className="absolute inset-0 rounded-lg [&:hover>a]:flex [&:focus-within>a]:flex">
                    <a
                      href={headerPictureHref}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Ouvrir la vue Panoramax de ${title}`}
                      className="gap-0.5 px-0.5 fr-link--no-icon absolute right-2 bottom-2 hidden h-8  items-center justify-center rounded-full !bg-white !bg-image-none text-black no-underline after:hidden hover:!bg-white hover:!bg-image-none active:!bg-white active:!bg-image-none focus:!bg-white focus:!bg-image-none focus:flex focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <i className="fr-icon-eye-line" aria-hidden="true" />
                      voir
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              {eyebrow ? (
                <p className="text-[0.65rem] m-0! font-bold tracking-widest uppercase text-blue-600">
                  {eyebrow}
                </p>
              ) : null}
              <h2
                id={titleId}
                className="m-0! text-[1rem]! text-slate-900 leading-tight!"
              >
                {title}
              </h2>
              {subtitle ? (
                <p className="m-0! text-[0.8rem]! leading-snug text-slate-600">
                  {subtitle}
                </p>
              ) : null}
              {stationContact ? (
                <p className="m-0! text-[0.8rem]! leading-snug text-slate-600">
                  {stationContact}
                </p>
              ) : null}
            </div>
            <Button
              priority="tertiary"
              iconId="fr-icon-close-line"
              title="Fermer le panneau"
              onClick={onClose}
            />
          </div>
        </div>

        <div
          className={`min-h-0 flex flex-col gap-4 overflow-y-auto p-4 ${bodyClassName ? ` ${bodyClassName}` : ""}`}
        >
          {children}
        </div>
      </div>
    </aside>
  );
}
