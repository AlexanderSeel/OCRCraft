import Image from "next/image";
import styles from "./training-print.module.css";

export function TrainingPrintMasthead({ locale }: { readonly locale: "de" | "en" }) {
  return (
    <div className={styles.masthead}>
      <div className={styles.identity}>
        <Image alt="OCR Frankfurt · Obstacle Course Racing" src="/brand/ocrfra-logo.png" width={250} height={143} unoptimized preload className={styles.logo} />
        <span className={styles.edition}>{locale === "en" ? "Club training / Session plan" : "Vereinstraining / Trainingsplan"}</span>
      </div>
      <Image alt="" aria-hidden="true" src="/brand/ocr-training-header.png" width={2172} height={724} unoptimized preload className={styles.artwork} />
      <span aria-hidden="true" className={styles.slash} />
    </div>
  );
}
