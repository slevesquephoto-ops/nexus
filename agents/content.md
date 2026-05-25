# Agent Content

## Responsabilités
- Parser les fichiers YAML vers la base de données
- Valider la structure des fichiers YAML
- Importer/mettre à jour le contenu via API admin

## Emplacement des fichiers YAML
```
packages/content/
  parcours/
    comp10/
      tracks/
        linux/
          modules/
            linux-fund-1.yaml
            linux-fund-2.yaml
            linux-fund-3.yaml
        windows/
          modules/
            windows-fund-1.yaml
    linux-carte/
      tracks/
        linux/          ← même track que comp10/linux (partagé)
          modules/      ← peut pointer vers les mêmes fichiers
```

## Format YAML complet
```yaml
module:
  id: linux-fund-1          # unique, kebab-case
  trackId: linux
  title: "Linux Fundamentals 1"
  description: "Histoire de Linux, premières commandes, navigation"
  order: 1
  xpReward: 50              # XP bonus à la complétion du module

  tasks:

    - id: linux-fund-1-t1
      type: task             # task = théorie + exercices
      title: "What is Linux?"
      order: 1
      xpReward: 15

      sections:

        - type: theory
          content: |
            Linux is an open-source operating system kernel
            created by **Linus Torvalds** in 1991.

        - type: code_block
          label: "Checking your Linux version"
          content: |
            user@linux:~$ uname -a
            Linux hostname 6.8.0 #1 SMP x86_64 GNU/Linux

        - type: command_table
          commands:
            - cmd: "pwd"
              desc: "Print current working directory"
            - cmd: "ls"
              desc: "List files and folders"
            - cmd: "cd"
              desc: "Change directory"

        - type: questions
          items:
            - id: q1
              type: qcm
              question: "Who created the Linux kernel?"
              answers:
                - text: "Richard Stallman"
                  correct: false
                - text: "Linus Torvalds"
                  correct: true
                - text: "Bill Gates"
                  correct: false
                - text: "Dennis Ritchie"
                  correct: false

            - id: q2
              type: short_answer
              question: "What command shows your Linux kernel version?"
              answer: "uname -a"

    - id: linux-fund-1-challenge
      type: challenge        # challenge = mission narrative finale
      title: "Challenge — First Contact"
      order: 2
      xpReward: 50
      # Le challenge utilise le système de mission existant
      # (teacher_graded, file_submission, ou qcm narratif)
```

## Types de sections disponibles
- `theory` : texte markdown avec support **gras**, `code inline`
- `code_block` : terminal stylisé avec label
- `command_table` : tableau cmd/description
- `questions` : liste de questions (qcm ou short_answer)

## Types de questions
- `qcm` : choix multiples, une seule bonne réponse
- `short_answer` : réponse texte exacte (insensible à la casse)

## Règles de contenu
- Les IDs sont uniques globalement (pas seulement dans le module)
- L'ordre des answers dans un QCM doit être randomisé à l'affichage
- Le challenge est toujours le dernier task du module (order le plus élevé)
- Un module sans challenge est valide (que des tasks pédagogiques)
- Le contenu est en anglais pour COMP10, en français pour les parcours FR
