Attribute VB_Name = "Declarations"
' ==================================================
'
'    ESPACE DE DECLARATION DES VARIABLES GLOBALES
'
' ==================================================

#If VBA7 Then
    Public Declare PtrSafe Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
#Else
    Public Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)
#End If

' Nom des IHM pour acces des unes vers les autres
Public frm_Nouvelle_partie As New Creation_partie
Public frm_Tableau_des_scores As New Tableau_des_scores
Public frm_Active As Partie_en_cours
Public frm_Fond As Fond_ecran

' Nombre de joueurs actifs
Public Nb_joueurs_lobby As Integer

' Nombre max d'avatars disponibles dans le jeu
Public max_Avatars As Integer

' Liste des noms et avatars des joueurs
Public Liste_noms() As Variant
Public Liste_avatars() As Variant

' Elements de gestion des chronomètres
Public running As Boolean
Public chronoStart As Double
Public remainingTime As Double

' Gestion de l'affichage du nombre de questions par thèmes
Public Nb_questions_DATES As Long, Nb_questions_DATES_disponibles As Long
Public Nb_questions_MONDEVIVANT As Long, Nb_questions_MONDEVIVANT_disponibles As Long
Public Nb_questions_ECONOMIE As Long, Nb_questions_ECONOMIE_disponibles As Long
Public Nb_questions_GEOGRAPHIE As Long, Nb_questions_GEOGRAPHIE_disponibles As Long
Public Nb_questions_SCIENCES As Long, Nb_questions_SCIENCES_disponibles As Long
Public Nb_questions_DIVERTISSEMENT As Long, Nb_questions_DIVERTISSEMENT_disponibles As Long
Public Nb_questions_SONDAGES As Long, Nb_questions_SONDAGES_disponibles As Long
Public Nb_questions_IMPROBABLE As Long, Nb_questions_IMPROBABLE_disponibles As Long
Public Nb_questions_RECORDS As Long, Nb_questions_RECORDS_disponibles As Long

' Definition de la liste des scpres possibles
Public Liste_scores As Variant

' Recuperation de l'ID de la question tirée au sort (pour pouvoir la supprimer avec le boutton "Invalider question"
Public ID_question_en_cours As Integer

' Gestion du nombre de questions de la partie en cours
Public Numero_question As Integer
Public Nombre_total_questions_partie As Integer

' Variables pour gestion des affichages dynamiques
Public Largeur_init As Integer
Public Largeur_fin As Integer

' Variables pour gestion des scores par categories et par joueurs
Public Theme_actif As String
Public Nb_themes As Integer
Public Nb_questions_posees_nom As Variant
Public Nb_questions_posees_valeurs() As Long
Public Scores_totaux() As Variant
Public Classement_final() As Integer
Public Scores_par_themes() As Variant









