VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} Creation_partie 
   ClientHeight    =   10560
   ClientLeft      =   120
   ClientTop       =   465
   ClientWidth     =   23760
   OleObjectBlob   =   "Creation_partie.frx":0000
   StartUpPosition =   1  'CenterOwner
End
Attribute VB_Name = "Creation_partie"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit


' ==================================================
'
'               INTERACTIONS AVEC IHM
'
' ==================================================


' -----------------------
'
' Fonction lancée au clic sur le boutton "Ajouter des joueurs"
'
' -----------------------
Private Sub button_Recuperation_Click()

    Dim Info_Gsheet_brut As String
    Dim Info_par_joueurs As Variant
    Dim i As Integer
    Dim ws As Worksheet

    ' Appel de la fonction qui récupère les infos du Google Sheet
    Info_Gsheet_brut = Appel_info_Gsheet()
    
    ' Vérification si on a bien reçu des données
    If Trim(Info_Gsheet_brut) = "" Then
        MsgBox "Aucune donnée reçue ou erreur de récupération.", vbExclamation
        Exit Sub
    End If
    
    ' Séparation des lignes de réponse (une ligne correspond à un joueur et sa réponse)
    Info_par_joueurs = Split(Info_Gsheet_brut, vbLf)
    
    ' Boucle pour remplir les données
    Dim Nb_joueurs As Integer
    Nb_joueurs = 0
    Erase Liste_noms
    Erase Liste_avatars
    
    For i = 0 To UBound(Info_par_joueurs)
    
        ' Séparation du nom de la réponse du joueur
        Dim valeurs As Variant
        valeurs = Split(Info_par_joueurs(i), ";")
     
        ' Si l'utilisateur souhaite jouer, on le renseigne dans les joueurs actif
        Dim Chemin_image_avatar As String, num_Avatar As Integer
        ' Cas du choix d'un avatar aléatoire
        If UCase(valeurs(1)) = "JOUER X" Then
            Nb_joueurs = Nb_joueurs + 1
            ' Insertion du nom
            Me.Controls("Joueur" & Nb_joueurs & "_Nom").Caption = valeurs(0)
            Me.Controls("Joueur" & Nb_joueurs & "_Nom").Visible = True
            ' Sauvegarde du nom
            ReDim Preserve Liste_noms(1 To Nb_joueurs)
            Liste_noms(Nb_joueurs) = valeurs(0)
            ' Insertion de l'avatar
            ReDim Preserve Liste_avatars(1 To Nb_joueurs)
            ' Selection d'une ligne aléatoire
            Randomize
            num_Avatar = Int(max_Avatars * Rnd) + 1
            Liste_avatars(Nb_joueurs) = num_Avatar
            Chemin_image_avatar = ThisWorkbook.Path & "\Avatars\Avatar" & Liste_avatars(Nb_joueurs) & "_normal.jpg"
            Me.Controls("image_Avatar_joueur" & Nb_joueurs).Picture = LoadPicture(Chemin_image_avatar)
            Me.Controls("image_Avatar_joueur" & Nb_joueurs).Visible = True
        ' Cas du choix d'un avatar spécifique
        Else
            For num_Avatar = 1 To max_Avatars
                If UCase(valeurs(1)) = "JOUER " & num_Avatar Then
                    Nb_joueurs = Nb_joueurs + 1
                    ' Insertion du nom
                    Me.Controls("Joueur" & Nb_joueurs & "_Nom").Caption = valeurs(0)
                    Me.Controls("Joueur" & Nb_joueurs & "_Nom").Visible = True
                    ' Sauvegarde du nom
                    ReDim Preserve Liste_noms(1 To Nb_joueurs)
                    Liste_noms(Nb_joueurs) = valeurs(0)
                    ' Insertion de l'avatar
                    ReDim Preserve Liste_avatars(1 To Nb_joueurs)
                    Liste_avatars(Nb_joueurs) = num_Avatar
                    Chemin_image_avatar = ThisWorkbook.Path & "\Avatars\Avatar" & Liste_avatars(Nb_joueurs) & "_normal.jpg"
                    Me.Controls("image_Avatar_joueur" & Nb_joueurs).Picture = LoadPicture(Chemin_image_avatar)
                    Me.Controls("image_Avatar_joueur" & Nb_joueurs).Visible = True
                End If
            Next num_Avatar
        End If
        
        ' Limitation à 8 joueurs, indépendamment du nombre de personnes souhaitant jouer
        If Nb_joueurs = 8 Then
            Exit For
        End If
        
    Next i
    
    ' Si moins de 8 joueurs, on cache les infos des slots non occupés
    For i = Nb_joueurs + 1 To 8
        Me.Controls("Joueur" & i & "_Nom").Caption = "-"
        Me.Controls("Joueur" & i & "_Nom").Visible = False
        Me.Controls("image_Avatar_joueur" & i).Visible = False
    Next i
    
    ' Mise à jour du nombre de joueurs dans la variable globale
    Nb_joueurs_lobby = Nb_joueurs
    
    ' On vérifier si la nouvelle saisie complète dans l'IHM permet de lancer une partie
    Possibilite_lancement_partie

End Sub


' -----------------------
'
' Fonction lancée au clic sur le boutton "Lancer"
'
' -----------------------
Private Sub button_Lancer_Click()

    ' Au lancement de la partie, si nombre de questions demandées incohérent, initialisation à 10 questions
    If Not IsNumeric(Me.textbox_Nombre_questions.Value) Or _
        Val(Me.textbox_Nombre_questions.Value) <> Int(Val(Me.textbox_Nombre_questions.Value)) Or _
        Val(Me.textbox_Nombre_questions.Value) < 0 Then
        Me.textbox_Nombre_questions.Value = 10
    End If
    ' On sauvegarde le nombre de questions total dans la variable globale
    Nombre_total_questions_partie = Me.textbox_Nombre_questions.Value
    ' Initialisation des questions posées
    Numero_question = 0
    ' Définition des noms des catégories
    Nb_themes = 9
    ReDim Nb_questions_posees_nom(0 To Nb_themes - 1)
    Nb_questions_posees_nom = Array("DATES", "MONDEVIVANT", "ECONOMIE", "GEOGRAPHIE", "SCIENCES", "DIVERTISSEMENT", "SONDAGES", "IMPROBABLE", "RECORDS")
    ReDim Nb_questions_posees_valeurs(0 To Nb_themes - 1)
    ' Initialisation des listes de scores totaux et par catégories (format : (theme 1 score joueur 1, theme 1 joueur N, theme M score joueur 1, theme M score joueur N)
    ReDim Scores_totaux(0 To Nb_joueurs_lobby - 1)
    ReDim Scores_par_themes(0 To Nb_themes * Nb_joueurs_lobby - 1)
    
    ' Intégration des noms de joueurs dans la partie lancée
    Dim frm_Partie_en_cours As New Partie_en_cours
    Dim i As Integer
    For i = 1 To Nb_joueurs_lobby
        frm_Partie_en_cours.Controls("image_Avatar_joueur" & i).Picture = LoadPicture(ThisWorkbook.Path & "\Avatars\Avatar" & Liste_avatars(i) & "_normal.jpg")
        frm_Partie_en_cours.Controls("label_Nom_joueur" & i).Caption = Liste_noms(i)
    Next i
    ' Redimensionnement de la frame "partie en cours" selon le nombre de joueurs
    frm_Partie_en_cours.Height = 327 + 45 * Nb_joueurs_lobby
    
    ' On effectue la copie des questions dans la feuille "Partie" selon les thèmes selectionnés et l'état de l'historique
    Copier_questions
    
    ' Definition de la liste des scores selon le nombre de joueurs
    Creation_liste_des_scores
    
    ' Centrer le UserForm
    CentreUserForm frm_Partie_en_cours
    
    ' On cache l'IHM de préparation et affiche l'IHM de la partie créée
    Me.Hide
    frm_Partie_en_cours.Show

End Sub


' -----------------------
'
' Fonction lancée au clic sur le boutton "Reinitialiser historique des questions"
'
' -----------------------
Private Sub button_Reinit_Click()

    ' Suppression des lignes contenues dans l'historique pour pouvoir reprendre les questions
    Dim wsHistorique As Worksheet
    Set wsHistorique = ThisWorkbook.Sheets("Historique questions")
    wsHistorique.Cells.Clear
    
    ' On relance l'affichage des questions disponibles
    Setup_affichage_pour_nouvelle_partie

End Sub


' -----------------------
'
' Fonction lancée au clic sur le boutton "Afficher la liste des avatars"
'
' -----------------------
Private Sub button_Acces_avatars_Click()

    ' Si on demande un affichage, on modifie la taille pour rendre visible et on change le texte du boutton
    If Me.button_Acces_avatars.Caption = "Afficher la liste des avatars" Then
        Me.button_Acces_avatars.Caption = "Masquer la liste des avatars"
        Largeur_init = 987
        Largeur_fin = 1200
        Modifier_taille_nouvelle_partie
    ' Si on demande un masquage, on modifie la taille pour rendre invisible et on change le texte du boutton
    ElseIf Me.button_Acces_avatars.Caption = "Masquer la liste des avatars" Then
        Me.button_Acces_avatars.Caption = "Afficher la liste des avatars"
        Largeur_init = 1200
        Largeur_fin = 987
        Modifier_taille_nouvelle_partie
    End If

End Sub


' -----------------------
'
' Fonction lancée au clic sur le boutton "Accéder à la liste des questions"
'
' -----------------------
Private Sub button_Acces_questions_Click()

    ' Si besoin d'accès aux questions, on réaffiche Excel en cachant l'IHM de jeu
    Application.Visible = True
    Me.Hide
    frm_Fond.Hide
    
End Sub


' -----------------------
'
' Fonction lancée si l'IHM est fermée par la croix en haut à droite
'
' -----------------------
Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)

    ' Réaffiche Excel à la fermeture
    Application.Visible = True
    
End Sub


' -----------------------
'
' Fonctions lancées par activation des coches des thèmes (pour vérifier si partie peut etre lancée ou non)
'
' -----------------------
Private Sub checkbox_Theme1_Click()
    Possibilite_lancement_partie
End Sub
Private Sub checkbox_Theme2_Click()
    Possibilite_lancement_partie
End Sub
Private Sub checkbox_Theme3_Click()
    Possibilite_lancement_partie
End Sub
Private Sub checkbox_Theme4_Click()
    Possibilite_lancement_partie
End Sub
Private Sub checkbox_Theme5_Click()
    Possibilite_lancement_partie
End Sub
Private Sub checkbox_Theme6_Click()
    Possibilite_lancement_partie
End Sub
Private Sub checkbox_Theme7_Click()
    Possibilite_lancement_partie
End Sub
Private Sub checkbox_Theme8_Click()
    Possibilite_lancement_partie
End Sub
Private Sub checkbox_Theme9_Click()
    Possibilite_lancement_partie
End Sub


' ==================================================
'
'                  AUTRES FONCTIONS
'
' ==================================================


' -----------------------
'
' Fonction appelée pour vérifier l'activation du boutton "Lancer" si les conditions de jeu sont remplies
'
' -----------------------
Sub Possibilite_lancement_partie()

    ' Le nombre de joueurs doit être au moins de deux, et au moins un thème doit être selectionné
    If Nb_joueurs_lobby >= 2 And _
        (Me.checkbox_Theme1.Value = True Or Me.checkbox_Theme2.Value = True Or _
        Me.checkbox_Theme3.Value = True Or Me.checkbox_Theme4.Value = True Or _
        Me.checkbox_Theme5.Value = True Or Me.checkbox_Theme6.Value = True Or _
        Me.checkbox_Theme7.Value = True Or Me.checkbox_Theme8.Value = True Or Me.checkbox_Theme9.Value = True) Then
        Me.button_Lancer.Enabled = True
    ' Sinon, impossible de lancer la partie
    Else
        Me.button_Lancer.Enabled = False
    End If

End Sub


' -----------------------
'
' Fonction appelée au lancement de la partie pour placer dans la feuille "Parties" les questions des thèmes selectionnés
'
' -----------------------
Sub Copier_questions()

    Dim wsBase As Worksheet, wsPartie As Worksheet, wsHistorique As Worksheet
    Dim Nb_questions_BDD As Long, Compteur_questions_partie As Long, Nb_questions_historique As Long
    Dim themes As Object, historiqueIDs As Object
    Dim Cell As Range
    Dim themeActive As Boolean
    Dim ID As String
    
    ' Définition des feuilles
    Set wsBase = ThisWorkbook.Sheets("Base de questions")
    Set wsPartie = ThisWorkbook.Sheets("Partie")
    Set wsHistorique = ThisWorkbook.Sheets("Historique questions")
    
    ' Creation d'un dictionnaire des thèmes avec l'état des checkboxes de l'IHM
    Set themes = CreateObject("Scripting.Dictionary")
    ' Creation du dictionnaire pour accès aux ID de questions stockées dans l'historique
    Set historiqueIDs = CreateObject("Scripting.Dictionary")

    ' Vérification des cases cochées sur l'IHM
    themes.Add "DATES", Me.checkbox_Theme1.Value
    themes.Add "MONDE VIVANT", Me.checkbox_Theme2.Value
    themes.Add "ECONOMIE", Me.checkbox_Theme3.Value
    themes.Add "GEOGRAPHIE", Me.checkbox_Theme4.Value
    themes.Add "SCIENCES", Me.checkbox_Theme5.Value
    themes.Add "DIVERTISSEMENT", Me.checkbox_Theme6.Value
    themes.Add "SONDAGES", Me.checkbox_Theme7.Value
    themes.Add "IMPROBABLE", Me.checkbox_Theme8.Value
    themes.Add "RECORDS", Me.checkbox_Theme9.Value

    ' Recherche de la dernière ligne de "Base de questions"
    Nb_questions_BDD = wsBase.Cells(wsBase.Rows.Count, 2).End(xlUp).Row
    ' Recherche de la dernière ligne de "Historique questions"
    Nb_questions_historique = wsHistorique.Cells(wsHistorique.Rows.Count, 1).End(xlUp).Row
    ' On vérifie si l'historique est entièrement vide
    If Nb_questions_historique = 1 And IsEmpty(wsHistorique.Cells(1, 1).Value) Then
        Nb_questions_historique = 0
    End If

    ' Chargement des IDs de l'historique dans un dictionnaire
    If Nb_questions_historique >= 1 Then
        Dim historiqueCell As Range
        For Each historiqueCell In wsHistorique.Range("A1:A" & Nb_questions_historique)
            ID = CStr(historiqueCell.Value)
            If Not historiqueIDs.exists(ID) Then historiqueIDs.Add ID, True
        Next historiqueCell
    End If

    ' Initialisation (nettoyage de la feuille "Partie" et placement sur première ligne à l'import)
    wsPartie.Cells.Clear
    Compteur_questions_partie = 1

    ' Boucle sur toutes les lignes de la feuille "Base de questions"
    For Each Cell In wsBase.Range("B2:B" & Nb_questions_BDD)
        ' On récupère l'ID de la question en cours de copie
        ID = CStr(wsBase.Cells(Cell.Row, 1).Value)
        If themes.exists(Cell.Value) Then
            ' Vérification si le thème de la question en cours de copie est selectionné par l'utilisateur
            themeActive = themes(Cell.Value)
            ' Si le thème est choisi et que l'ID de la question n'est pas dans l'historique des déjà faites, on copie la ligne dans la feulle "Partie"
            If themeActive And Not historiqueIDs.exists(ID) Then
                wsBase.Rows(Cell.Row).Copy Destination:=wsPartie.Rows(Compteur_questions_partie)
                Compteur_questions_partie = Compteur_questions_partie + 1
            End If
        End If
    Next Cell
    
    ' Nettoyage
    Set themes = Nothing
    Set historiqueIDs = Nothing

End Sub

Sub Creation_liste_des_scores()

    Dim i As Integer
    Dim j As Integer
    
    ' Initialiser la liste des scores avec la taille correspondante
    ReDim Liste_scores(0 To Nb_joueurs_lobby - 1)
    
    ' Remplir la liste des scores
    If Nb_joueurs_lobby = 2 Then
        Liste_scores(0) = 1
        Liste_scores(1) = 0
    ElseIf Nb_joueurs_lobby = 3 Then
        Liste_scores(0) = 1
        Liste_scores(1) = 0
        Liste_scores(2) = -1
    ElseIf Nb_joueurs_lobby = 4 Then
        Liste_scores(0) = 1
        Liste_scores(1) = 0
        Liste_scores(2) = 0
        Liste_scores(3) = -1
    ElseIf Nb_joueurs_lobby = 5 Then
        Liste_scores(0) = 2
        Liste_scores(1) = 1
        Liste_scores(2) = 0
        Liste_scores(3) = -1
        Liste_scores(4) = -2
    ElseIf Nb_joueurs_lobby = 6 Then
        Liste_scores(0) = 2
        Liste_scores(1) = 1
        Liste_scores(2) = 0
        Liste_scores(3) = 0
        Liste_scores(4) = -1
        Liste_scores(5) = -2
    ElseIf Nb_joueurs_lobby = 7 Then
        Liste_scores(0) = 3
        Liste_scores(1) = 2
        Liste_scores(2) = 1
        Liste_scores(3) = 0
        Liste_scores(4) = -1
        Liste_scores(5) = -2
        Liste_scores(6) = -3
    ElseIf Nb_joueurs_lobby = 8 Then
        Liste_scores(0) = 3
        Liste_scores(1) = 2
        Liste_scores(2) = 1
        Liste_scores(3) = 0
        Liste_scores(4) = 0
        Liste_scores(5) = -1
        Liste_scores(6) = -2
        Liste_scores(7) = -3
    End If

End Sub
