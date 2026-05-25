# Format YAML — Contenu NEXUS

## Emplacement des fichiers
```
packages/content/
  parcours/
    {parcoursId}/
      tracks/
        {trackId}/
          modules/
            {moduleId}.yaml
```

## Structure YAML complète et valide
```yaml
module:
  id: linux-fund-1           # string, unique global, kebab-case
  trackId: linux             # doit correspondre à un Track en DB
  title: "Linux Fundamentals 1"
  description: "Histoire de Linux, premières commandes, navigation"
  order: 1                   # entier, ordre dans le track
  xpReward: 50               # XP bonus accordé à la complétion du module

  tasks:

    # ── TYPE: task (théorie + exercices) ──────────────────
    - id: linux-fund-1-t1    # string, unique global
      type: task
      title: "What is Linux?"
      order: 1
      xpReward: 15

      sections:

        # Théorie en markdown
        - type: theory
          content: |
            Linux is an open-source operating system kernel
            created by **Linus Torvalds** in 1991.
            Unlike Windows, Linux is free and open-source.

        # Bloc terminal stylisé
        - type: code_block
          label: "Checking your Linux version"
          content: |
            user@linux:~$ uname -a
            Linux hostname 6.8.0 #1 SMP x86_64 GNU/Linux
            user@linux:~$ whoami
            student

        # Tableau de commandes
        - type: command_table
          commands:
            - cmd: "pwd"
              desc: "Print current working directory"
            - cmd: "ls"
              desc: "List files and folders"
            - cmd: "cd /path"
              desc: "Change to a specific directory"

        # Questions inline
        - type: questions
          items:

            # QCM — choix multiples
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

            # Réponse courte
            - id: q2
              type: short_answer
              question: "What command shows your current directory?"
              answer: "pwd"

    # ── TYPE: challenge (mission narrative finale) ─────────
    - id: linux-fund-1-challenge
      type: challenge
      title: "Challenge — First Contact"
      order: 2               # toujours le dernier dans le module
      xpReward: 50
      # Pas de sections — le challenge est géré par le système
      # de mission existant (interface séparée)
```

## Règles de validation
1. Les `id` sont uniques globalement (pas seulement dans le module)
2. `order` commence à 1 et est séquentiel
3. Le `challenge` est toujours le dernier task (order le plus élevé)
4. Les réponses QCM doivent être randomisées à l'AFFICHAGE (pas dans le YAML)
5. `short_answer` est insensible à la casse lors de la correction
6. Un module peut ne pas avoir de challenge (seulement des tasks)
7. `trackId` doit correspondre à un enregistrement Track existant en DB

## Types de sections valides
| type | Champs requis | Description |
|------|--------------|-------------|
| theory | content | Texte markdown |
| code_block | label, content | Terminal stylisé |
| command_table | commands[] | Tableau cmd/desc |
| questions | items[] | Questions inline |

## Types de questions valides
| type | Champs requis | Description |
|------|--------------|-------------|
| qcm | question, answers[] | Un seul correct:true |
| short_answer | question, answer | Texte exact (insensible casse) |
```
