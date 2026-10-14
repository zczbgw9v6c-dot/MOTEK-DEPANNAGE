# Francisation et renommage de la base « Carrosserie Centrale » (fr-CH) vers MOTEK (fr-FR).
# Idempotent : réapplicable après un nouveau découpage. Usage : python3 scripts/franciser-motek.py
import re, pathlib, hashlib
root = pathlib.Path(__file__).resolve().parent.parent / "motek"
files = sorted(list((root / "js").glob("*.js")) + list((root / "css").glob("*.css")) + [root / "index.html"])

CITIES = {
    "1004 Lausanne": "69007 Lyon", "1003 Lausanne": "69002 Lyon", "1007 Lausanne": "69007 Lyon", "1012 Lausanne": "69003 Lyon",
    "1018 Lausanne": "69009 Lyon", "1110 Morges": "69200 Vénissieux", "1020 Renens": "69100 Villeurbanne", "1009 Pully": "69300 Caluire-et-Cuire",
    "1700 Fribourg": "69500 Bron", "1800 Vevey": "69600 Oullins", "1095 Lutry": "69330 Meyzieu", "1196 Gland": "69800 Saint-Priest",
    "1052 Le Mont-sur-Lausanne": "69120 Vaulx-en-Velin", "1066 Épalinges": "69130 Écully", "1008 Prilly": "69700 Givors", "1073 Savigny": "69960 Corbas",
    "Av. de Sévelin 24, 1004 Lausanne": "12 rue des Ateliers, 69007 Lyon",
    "Av. de Sévelin 24": "12 rue des Ateliers", "Lausanne · Sévelin": "Lyon · Gerland", "Lausanne": "Lyon", "Renens": "Villeurbanne", "Crissier": "Saint-Priest",
    "Romandie Services SA": "Rhône Services SAS", "Léman Leasing SA": "Lyon Leasing SAS", "Garage des Alpes Sàrl": "Garage des Monts SARL",
    "romandie-services.ch": "rhone-services.fr", "leman-leasing.ch": "lyon-leasing.fr", "garage-des-alpes.ch": "garage-des-monts.fr",
    "Rue de Lausanne 31": "31 rue de la République", "Av. de Morges 58": "58 avenue Jean-Jaurès", "Ch. du Banc-Vert 12": "12 chemin des Vignes",
    "Av. de Lavaux 104": "104 avenue de Saxe", "Ch. de Bérée 7": "7 chemin des Peupliers", "Rte de la Glâne 22": "22 route de Grenoble",
    "Quai Perdonnet 9": "9 quai Claude-Bernard", "Av. de Cour 41": "41 avenue Berthelot", "Grand-Rue 18": "18 Grande Rue", "Rue Mauverney 6": "6 rue Pasteur",
    "Rue du Simplon 40": "40 rue Garibaldi", "Rue du Grand-Chêne 5": "5 rue de la Part-Dieu", "Rte de Cugy 14": "14 route de Vienne",
    "Ch. de Pierrefleur 33": "33 chemin des Cerisiers", "Rte de la Croix-Blanche 3": "3 route de Paris", "Av. de la Rochelle 9": "9 avenue Gambetta", "Ch. de la Branche 21": "21 chemin du Vallon",
}
INSURERS = {  # id : (court, long, couleur, téléphone, e-mail)
    "axa": ("AXA", "AXA France IARD", "#00008f", "09 70 80 81 82", "sinistres.auto@axa.fr"),
    "mob": ("MAIF", "MAIF", "#e3001b", "09 72 72 15 15", "sinistres@maif.fr"),
    "all": ("Allianz", "Allianz France", "#003781", "09 69 32 02 03", "sinistres.auto@allianz.fr"),
    "zur": ("Macif", "Macif", "#2167ae", "09 69 39 49 49", "sinistres@macif.fr"),
    "hel": ("Groupama", "Groupama Rhône-Alpes Auvergne", "#00a0af", "09 69 39 66 66", "sinistres@groupama.fr"),
    "gen": ("Generali", "Generali France", "#c21b17", "09 69 32 21 21", "sinistres@generali.fr"),
    "bal": ("Matmut", "Matmut", "#0014aa", "02 35 03 68 68", "sinistres@matmut.fr"),
    "vau": ("MMA", "MMA IARD", "#007a4d", "02 43 39 11 11", "sinistres@mma.fr"),
    "tcs": ("GMF", "GMF Assurances", "#ffcc00", "09 70 80 90 90", "sinistres@gmf.fr"),
    "smi": ("Leocare", "Leocare (assurance en ligne)", "#f05a28", "01 76 49 00 00", "sinistres@leocare.fr"),
}
OLD_INS = {"axa": "AXA", "mob": "La Mobilière", "all": "Allianz", "zur": "Zurich", "hel": "Helvetia", "gen": "Generali", "bal": "Baloise", "vau": "Vaudoise", "tcs": "TCS", "smi": "Smile"}

def fr_plate(m):
    # Plaque française SIV déterministe à partir de l'ancienne plaque (AA-123-AA).
    h = hashlib.md5(m.group(0).encode()).digest()
    L = "BCDFGHJKLMNPRSTVWXZ"
    digits = re.sub(r"\D", "", m.group(0))[-3:].rjust(3, "0")
    return f"{L[h[0] % 19]}{L[h[1] % 19]}-{digits}-{L[h[2] % 19]}{L[h[3] % 19]}"

def phone(m):
    s = m.group(0)
    if s.startswith("+41 21") or s.startswith("+41 22"): return "+33 4 72" + s[6:]
    if s.startswith("+41 7"): return "+33 6" + s[5:]
    return "+33 1" + s[5:]

REPL = [
    # --- devise, TVA, formats ---
    (r"const TVA = 0\.081;", "const TVA = 0.2;"),
    (r"const round5 = n => Math\.round\(\(n \|\| 0\) \* 20\) / 20;", "const round5 = n => Math.round((n || 0) * 100) / 100; // arrondi au centime (ex-arrondi 5 ct)"),
    (r"const chf = n => 'CHF ' \+ Math\.round\(n \|\| 0\)\.toLocaleString\('de-CH'\);", "const chf = n => Math.round(n || 0).toLocaleString('fr-FR') + ' €';"),
    (r"const chf2 = n => 'CHF ' \+ \(Math\.round\(\(n \|\| 0\) \* 100\) / 100\)\.toLocaleString\('de-CH', \{ minimumFractionDigits: 2, maximumFractionDigits: 2 \}\);",
     "const chf2 = n => (Math.round((n || 0) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';"),
    (r"const chfK = n => Math\.abs\(n\) >= 1e4 \? 'CHF ' \+ \(Math\.round\(n / 100\) / 10\)\.toLocaleString\('de-CH'\) \+ ' k' : chf\(n\);",
     "const chfK = n => Math.abs(n) >= 1e4 ? (Math.round(n / 100) / 10).toLocaleString('fr-FR') + ' k€' : chf(n);"),
    (r"fr-CH", "fr-FR"), (r"de-CH", "fr-FR"),
    (r"'CHF '", "''"), (r"CHF TTC", "€ TTC"), (r"\(CHF\)", "(€)"), (r"CHF / h", "€ / h"), (r"CHF/h", "€/h"), (r"<th class=\"n\">CHF</th>", '<th class="n">€</th>'),
    (r"CHF (\d[\d’ ]*\d|\d)", r"\1 €"), (r"> CHF ", "> "), (r"'CHF'", "'€'"), (r"\bCHF\b", "€"),
    (r"8\.1 %", "20 %"), (r"TVA 8,1", "TVA 20"), (r"arrondi 5 ct\.?|arrondi à 5 centimes", "au centime"),
    (r"Carte \(TWINT\)", "Carte sans contact"), (r"TWINT", "sans contact"),
    # --- identité ---
    (r"Carrosserie Centrale SA", "MOTEK Garage"), (r"CARROSSERIE CENTRALE", "MOTEK"), (r"Carrosserie Centrale", "MOTEK"),
    (r"carrosserie-centrale-lausanne", "motek-demo"), (r"carrosserie-centrale\.ch", "motek-demo.fr"), (r"carrosserie-centrale", "motek"),
    (r"SA · ATELIER & ERP", "GARAGE · ATELIER & ERP"), (r"SA · ATELIER LIVE", "GARAGE · ATELIER LIVE"),
    (r"CARROSSERIE · PEINTURE · EXPERTISE", "CARROSSERIE · MÉCANIQUE · PEINTURE"), (r"Carrosserie · Peinture · Expertise", "Carrosserie · Mécanique · Peinture"),
    (r"'cc-demo-v2'", "'motek-v3'"),
    (r"ide: 'CHE-112\.874\.390', iban: 'CH44 3199 9123 0008 8901 2', qriban: 'CH21 3080 8001 2345 6782 7', bank: 'BCV – Banque Cantonale Vaudoise'",
     "siret: '123 456 789 00012', tvaIntra: 'FR12 123456789', iban: 'FR76 3000 6000 0112 3456 7890 189', bic: 'BNPAFRPP', bank: 'Banque de démonstration'"),
    (r"rates: \{ T1: 118, T2: 132, T3: 148, P: 128 \}, paintMat: 46, smallPct: 0\.03, smallMax: 85", "rates: { T1: 62, T2: 72, T3: 85, P: 70 }, paintMat: 28, smallPct: 0.03, smallMax: 60"),
    (r"IDE \$\{esc\(co\.ide\)\} TVA", "SIRET ${esc(co.siret)} · TVA ${esc(co.tvaIntra)}"),
    (r"CHE-112\.874\.390", "123 456 789 00012"), (r"\bIDE\b", "SIRET"),
    # --- métiers / formations / assurance ---
    (r"Brevet fédéral", "BTS après-vente automobile"), (r"Carrossier-tôlier CFC", "Carrossier-tôlier (CAP/Bac pro)"), (r"Carrossier CFC", "Carrossier (CAP)"),
    (r"Mécatronicien CFC", "Mécatronicien (Bac pro)"), (r"\bCFC\b", "CAP"),
    (r"Casco complète", "Tous risques"), (r"Casco partielle", "Tiers étendu"), (r"\bCasco\b", "Tous risques"),
    (r"passage au SAN", "contrôle technique"), (r"\bSAN\b", "contrôle technique"),
    (r"Service sinistres auto", "Service sinistres automobile"),
    (r"bluewin\.ch", "orange.fr"), (r"sunrise\.ch", "free.fr"), (r"hispeed\.ch", "sfr.fr"), (r"netplus\.ch", "laposte.net"), (r"protonmail\.ch", "proton.me"),
    # --- fournisseurs ---
    (r"AMAG Parts \(VW · Audi · Škoda\)", "Volkswagen Group France — pièces"), (r"pieces@amag\.ch", "pieces@vwgroup-demo.fr"),
    (r"BMW \(Suisse\) SA — pièces", "BMW France — pièces"), (r"parts@bmw\.ch", "pieces@bmw-demo.fr"),
    (r"Tesla Service Lausanne", "Tesla Service Lyon"), (r"service-lausanne@tesla\.com", "service-lyon@tesla-demo.fr"),
    (r"Emil Frey — pièces \(Toyota · Mercedes\)", "Distributeur Toyota · Mercedes — pièces"), (r"pieces\.crissier@emilfrey\.ch", "pieces@distrib-demo.fr"),
    (r"Derendinger SA", "Autodistribution"), (r"commande@derendinger\.ch", "commande@autodistribution-demo.fr"),
    (r"Technomag SA", "Alliance Automotive"), (r"lausanne@technomag\.ch", "lyon@alliance-demo.fr"),
    (r"ColorLab Lack SA \(Standox\)", "Peintures Axalta (Standox)"), (r"commandes@colorlab\.ch", "commandes@axalta-demo.fr"),
    (r"Würth AG", "Würth France"), (r"service@wuerth-ag\.ch", "service@wurth-demo.fr"),
    (r"pieces\.lausanne@stellantis\.com", "pieces.lyon@stellantis-demo.fr"), (r"pieces\.vd@renault\.ch", "pieces.lyon@renault-demo.fr"),
    (r"mobiliere\.ch", "maif.fr"), (r"@[a-z.-]*\.ch\b", lambda m: m.group(0)[:-3] + ".fr"),
    # --- accent visuel : rouge → bleu MOTEK ---
    (r"#e3262d", "#1768ee"), (r"#c41d24", "#1157c4"), (r"#fdeeee", "#e8f0fe"), (r"#fad6d7", "#cfe0fb"), (r"rgba\(227,38,45,", "rgba(23,104,238,"),
]
PLATE = re.compile(r"\b(?:VD|FR|GE|VS|NE|JU|BE|ZH) \d{1,3}(?: \d{3})?\b")
PHONE = re.compile(r"\+41 \d{2} \d{3} \d{2} \d{2}")

def apply(text, path):
    for a, b in REPL: text = re.sub(a, b, text)
    for a, b in CITIES.items(): text = text.replace(a, b)
    text = PLATE.sub(fr_plate, text)
    text = PHONE.sub(phone, text)
    # assureurs : remplacement ligne à ligne dans le référentiel, puis noms dans les textes.
    for k, (short, name, color, tel, mail) in INSURERS.items():
        text = re.sub(rf"\['{k}', '[^']*', '[^']*', '#[0-9a-f]{{6}}', '[^']*', '[^']*',", f"['{k}', '{short}', '{name}', '{color}', '{tel}', '{mail}',", text)
    for k, old in OLD_INS.items():
        new = INSURERS[k][0]
        if old != new:
            text = re.sub(rf"(?<![\w-]){re.escape(old)}(?![\w-])", new, text)
    return text

for f in files:
    t = f.read_text(encoding="utf-8"); n = apply(t, f)
    if n != t: f.write_text(n, encoding="utf-8"); print("francisé :", f.relative_to(root))
