VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} Partie_en_cours 
   ClientHeight    =   13320
   ClientLeft      =   120
   ClientTop       =   465
   ClientWidth     =   22620
   OleObjectBlob   =   "Partie_en_cours.frx":0000
   StartUpPosition =   1  'CenterOwner
End
Attribute VB_Name = "Partie_en_cours"
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
' Fonction lancée au clic sur le boutton "Question suivante"
'
' -----------------------
Private Sub button_Suivant_Click()

    ' Ce boutton est un renvoi à "Tableau des scores" si on a posé la dernière question
    If Numero_question = Nombre_total_questions_partie Then
    
        ' On envoi les résultats totaux dans la variable globale
        Dim i As Integer
        For i = 1 To Nb_joueurs_lobby
            Scores_totaux(i - 1) = Me.Controls("label_Total_joueur" & i).Caption
        Next i
    
        Set frm_Tableau_des_scores = New Tableau_des_scores
        
        ' Centrer le UserForm
        CentreUserForm frm_Tableau_des_scores
        
        Me.Hide
        frm_Tableau_des_scores.Show
        
    ' Sinon, génération de la question suivante
    Else
        ' Affichage et masquage de début de manche pour chaque joueurs
        For i = 1 To Nb_joueurs_lobby
            ' On cache les reponses des joueurs ainsi que les scores de la manche
            Me.Controls("label_Reponse_joueur" & i).Visible = False
            Me.Controls("label_Score_joueur" & i).Visible = False
            Me.Controls("label_Score_joueur" & i).ForeColor = RGB(0, 0, 0)
            ' On initialise les status à "FAUX"
            Me.Controls("image_Statut_joueur" & i).Picture = LoadPicture(ThisWorkbook.Path & "\image_mauvaise_reponse.jpg")
            ' On intialise les avatars normaux
            Me.Controls("image_Avatar_joueur" & i).Picture = LoadPicture(ThisWorkbook.Path & "\Avatars\Avatar" & Liste_avatars(i) & "_normal.jpg")
        Next i
        ' On desactive l'accès aux bouttons
        Me.button_Suivant.Enabled = False
        Me.button_Resultats.Enabled = False
        Me.button_Invalider.Enabled = False
        ' On cache le champ de réponse ainsi que les compléments de réponse
        Me.Label_Reponse.Visible = False
        Me.label_Complement.Visible = False
    
        ' On tire au sort une question et on met en place les labels correspondant
        Deploiement_question
    
        ' On défini ce frame comme actif pour appel depuis Routines_utilitaires
        Set frm_Active = Me
        ' Initialisation du chronomètre
        chronoStart = Timer
        remainingTime = 30
        running = True
        frm_Active.label_Chrono.Caption = "30 s"
        
        ' Appel a la fonction de démarrage du chronomètre
        Routines_utilitaires.UpdateChrono
    End If

End Sub


' -----------------------
'
' Fonction lancée au clic sur le boutton "Afficher réponse"
'
' -----------------------
Private Sub button_Resultats_Click()

    ' On désactive l'accès au boutton "Afficher réponse" mais on rend disponible les bouttons "Invalider question" et "Question suivante"
    Me.button_Suivant.Enabled = True
    Me.button_Resultats.Enabled = False
    Me.button_Invalider.Enabled = True
    
    ' On affiche les champs de résultat
    Me.Label_Reponse.Visible = True
    Me.label_Complement.Visible = True
    
    ' Calcul du classement des joueurs en fonction de leur réponse (écart avec la bonne réponse)
    Classement_joueurs

End Sub


' -----------------------
'
' Fonction lancée au clic sur le boutton "Invalider question"
'
' -----------------------
Private Sub button_Invalider_Click()

    ' On retire l'accès au boutton "Invalider question"
    Me.button_Invalider.Enabled = False
    
    ' On annule les scores réalisés sur la manche
    Dim i As Integer
    For i = 1 To Nb_joueurs_lobby
        ' Reprise des scores totaux
        Me.Controls("label_Total_joueur" & i).Caption = CStr(CInt(Me.Controls("label_Total_joueur" & i).Caption) - CInt(Me.Controls("label_Score_joueur" & i).Caption))
        ' Reinitialisation du score de la manche et de la couleur du texte
        Me.Controls("label_Score_joueur" & i).Caption = "0"
        Me.Controls("label_Score_joueur" & i).ForeColor = RGB(0, 0, 0)
    Next i
    
    ' Affichage du pop up proposant la suppression de la question dans la base de données
    Invalider_question.Show

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


' ==================================================
'
'                  AUTRES FONCTIONS
'
' ==================================================


' -----------------------
'
' Fonction appelée lors de la génération d'une nouvelle question, pour tirage au sort de la question
'
' -----------------------
Sub Deploiement_question()

    Dim wsPartie As Worksheet, wsHistorique As Worksheet
    Dim Nb_questions_partie As Long, Nb_questions_historique As Long
    Dim Ligne_tiree_au_sort As Long
    
    ' Définition de la feuille de partie et de la dernière ligne de la feuille
    Set wsPartie = ThisWorkbook.Sheets("Partie")
    Nb_questions_partie = wsPartie.Cells(wsPartie.Rows.Count, 1).End(xlUp).Row
    ' Definition de la feuille d'historique et de la dernière ligne de la feuille
    Set wsHistorique = ThisWorkbook.Sheets("Historique questions")
    Nb_questions_historique = wsHistorique.Cells(wsHistorique.Rows.Count, 1).End(xlUp).Row
    ' On vérifie si l'historique est entièrement vide
    If Nb_questions_historique = 1 And IsEmpty(wsHistorique.Cells(1, 1).Value) Then
        Nb_questions_historique = 0
    End If
    
    ' Selection d'une ligne aléatoire (entre 1 et Nb_questions_partie)
    Randomize
    Ligne_tiree_au_sort = Int(Nb_questions_partie * Rnd) + 1
    
    ' On sauvegarde l'ID de la question (en cas de besoin de suppression via le boutton "Invalider question")
    ID_question_en_cours = wsPartie.Cells(Ligne_tiree_au_sort, 1)
    
    ' On affiche l'image du thème de la question et on incrémente le nombre de questions posées du thème
    If wsPartie.Cells(Ligne_tiree_au_sort, 2) = "DATES" Then
        Theme_actif = "DATES"
        Nb_questions_posees_valeurs(0) = Nb_questions_posees_valeurs(0) + 1
        Me.image_Theme.Picture = LoadPicture(ThisWorkbook.Path & "\Themes\Dates.jpg")
    ElseIf wsPartie.Cells(Ligne_tiree_au_sort, 2) = "MONDE VIVANT" Then
        Theme_actif = "MONDEVIVANT"
        Nb_questions_posees_valeurs(1) = Nb_questions_posees_valeurs(1) + 1
        Me.image_Theme.Picture = LoadPicture(ThisWorkbook.Path & "\Themes\Monde_vivant.jpg")
    ElseIf wsPartie.Cells(Ligne_tiree_au_sort, 2) = "ECONOMIE" Then
        Theme_actif = "ECONOMIE"
        Nb_questions_posees_valeurs(2) = Nb_questions_posees_valeurs(2) + 1
        Me.image_Theme.Picture = LoadPicture(ThisWorkbook.Path & "\Themes\Economie.jpg")
    ElseIf wsPartie.Cells(Ligne_tiree_au_sort, 2) = "GEOGRAPHIE" Then
        Theme_actif = "GEOGRAPHIE"
        Nb_questions_posees_valeurs(3) = Nb_questions_posees_valeurs(3) + 1
        Me.image_Theme.Picture = LoadPicture(ThisWorkbook.Path & "\Themes\Geographie.jpg")
    ElseIf wsPartie.Cells(Ligne_tiree_au_sort, 2) = "SCIENCES" Then
        Theme_actif = "SCIENCES"
        Nb_questions_posees_valeurs(4) = Nb_questions_posees_valeurs(4) + 1
        Me.image_Theme.Picture = LoadPicture(ThisWorkbook.Path & "\Themes\Sciences.jpg")
    ElseIf wsPartie.Cells(Ligne_tiree_au_sort, 2) = "DIVERTISSEMENT" Then
        Theme_actif = "DIVERTISSEMENT"
        Nb_questions_posees_valeurs(5) = Nb_questions_posees_valeurs(5) + 1
        Me.image_Theme.Picture = LoadPicture(ThisWorkbook.Path & "\Themes\Divertissement.jpg")
    ElseIf wsPartie.Cells(Ligne_tiree_au_sort, 2) = "SONDAGES" Then
        Theme_actif = "SONDAGES"
        Nb_questions_posees_valeurs(6) = Nb_questions_posees_valeurs(6) + 1
        Me.image_Theme.Picture = LoadPicture(ThisWorkbook.Path & "\Themes\Sondages.jpg")
    ElseIf wsPartie.Cells(Ligne_tiree_au_sort, 2) = "IMPROBABLE" Then
        Theme_actif = "IMPROBABLE"
        Nb_questions_posees_valeurs(7) = Nb_questions_posees_valeurs(7) + 1
        Me.image_Theme.Picture = LoadPicture(ThisWorkbook.Path & "\Themes\Improbable.jpg")
    ElseIf wsPartie.Cells(Ligne_tiree_au_sort, 2) = "RECORDS" Then
        Theme_actif = "RECORDS"
        Nb_questions_posees_valeurs(8) = Nb_questions_posees_valeurs(8) + 1
        Me.image_Theme.Picture = LoadPicture(ThisWorkbook.Path & "\Themes\Records.jpg")
    End If
    
    ' Incrémentation du numéro de la question
    Numero_question = Numero_question + 1
    ' Si c'est la dernière question, on remplace le boutton "Question suivante" par "Tableau des scores"
    If Numero_question = Nombre_total_questions_partie Then
        Me.button_Suivant.Caption = "Tableau des scores"
    End If
    
    ' On renseigne les label avec la question selectionnée (en ajoutant le numéro de question au label)
    Me.label_Question.Caption = "Question " & Numero_question & "/" & Nombre_total_questions_partie & " : " & wsPartie.Cells(Ligne_tiree_au_sort, 3)
    Me.Label_Reponse.Tag = wsPartie.Cells(Ligne_tiree_au_sort, 4)
    Me.label_Complement.Caption = wsPartie.Cells(Ligne_tiree_au_sort, 5)
    
    ' Détermination du format de la réponse en fonction du nombre de décimales
    Dim formatStr As String
    If wsPartie.Cells(Ligne_tiree_au_sort, 4) = Int(wsPartie.Cells(Ligne_tiree_au_sort, 4)) Then
        formatStr = "#,##0"
    Else
        formatStr = "#,##0.00"
    End If
    Me.Label_Reponse.Caption = Format(wsPartie.Cells(Ligne_tiree_au_sort, 4), formatStr)
       
    ' On copie la question dans l'historique
    wsPartie.Rows(Ligne_tiree_au_sort).Copy Destination:=wsHistorique.Rows(Nb_questions_historique + 1)
    
    ' Suppression de la ligne de la question tirée dans la partie en cours
    wsPartie.Rows(Ligne_tiree_au_sort).Delete Shift:=xlUp


End Sub


' -----------------------
'
' Fonction appelée pendant l'affichage du résultat pour calculer placement relatif des joueurs et mise à jour des scores
'
' -----------------------
Sub Classement_joueurs()

    Dim Liste_reponses As Variant, Liste_indices As Variant
    Dim i As Integer, j As Integer
    Dim temp_val As Variant
    Dim temp_idx As Integer

    ' Concetpion de "Liste_reponses" qui contient les reponses dans l'ordre des joueurs
    ReDim Liste_reponses(0 To Nb_joueurs_lobby - 1)
    For i = LBound(Liste_reponses) To UBound(Liste_reponses)
        ' Si la réponse n'avait pas un format attendu, on la place à -1 en vue du tri
        If Not IsNumeric(Me.Controls("label_Reponse_joueur" & i + 1).Tag) Then
            Liste_reponses(i) = -1
        Else
            Liste_reponses(i) = Abs(CDbl(Me.Controls("label_Reponse_joueur" & i + 1).Tag) - CDbl(Me.Label_Reponse.Tag))
        End If
    Next i
    
    ' Initialisation de la liste des indices
    ReDim Liste_indices(LBound(Liste_reponses) To UBound(Liste_reponses))
    For i = LBound(Liste_reponses) To UBound(Liste_reponses)
        Liste_indices(i) = i + 1
    Next i
    
   ' Tri des valeurs de Liste_reponses et de Liste_indices en vis à vis
    For i = LBound(Liste_reponses) To UBound(Liste_reponses) - 1
        For j = i + 1 To UBound(Liste_reponses)
            If Liste_reponses(i) > Liste_reponses(j) Then
                ' Échanger les valeurs
                temp_val = Liste_reponses(i)
                Liste_reponses(i) = Liste_reponses(j)
                Liste_reponses(j) = temp_val
                ' Échanger les indices correspondants
                temp_idx = Liste_indices(i)
                Liste_indices(i) = Liste_indices(j)
                Liste_indices(j) = temp_idx
            End If
        Next j
    Next i

    ' Création de la liste ciblant les bons scores dans la variable publique Liste_scores
    Dim Liste_pour_cible_resultats As Variant
    ReDim Liste_pour_cible_resultats(LBound(Liste_reponses) To UBound(Liste_reponses))

    ' Initialisation des classements
    Dim position As Integer, Modification_classement As Boolean
    For i = LBound(Liste_reponses) To UBound(Liste_reponses)
        Liste_pour_cible_resultats(i) = i
    Next i
    Modification_classement = True

    ' Boucle pour gestion des cas d'égalité dans les classements
    While Modification_classement
        Modification_classement = False
        For i = LBound(Liste_reponses) + 1 To UBound(Liste_reponses)
            ' Si la réponse actuelle est différente de la précédente, on décrémente la position
            If (Liste_reponses(i) = Liste_reponses(i - 1) And Liste_pour_cible_resultats(i) <> Liste_pour_cible_resultats(i - 1)) Then
                Modification_classement = True
                Liste_pour_cible_resultats(i) = Liste_pour_cible_resultats(i) - 1
            End If
        Next i
    Wend
    
    ' Traitement en fin de boucle des classements : Si des premiers avaient la valeur -1, ils deviennent dernier puis offset des autres
    Dim Classement_des_joueurs_a_declasser As Integer, Nombre_joueurs_a_declasser As Integer
    Classement_des_joueurs_a_declasser = -1
    Nombre_joueurs_a_declasser = 0
    ' Recherche du classement obtenu par les joueurs a declasser et de leur nombre dans le lobby
    For i = LBound(Liste_reponses) To UBound(Liste_reponses)
        If Liste_reponses(i) = -1 Then
            Classement_des_joueurs_a_declasser = Liste_pour_cible_resultats(i)
            Nombre_joueurs_a_declasser = Nombre_joueurs_a_declasser + 1
        End If
    Next i
    ' Application des offset
    For i = LBound(Liste_reponses) To UBound(Liste_reponses)
        If Liste_pour_cible_resultats(i) = Classement_des_joueurs_a_declasser Then
            Liste_pour_cible_resultats(i) = Nb_joueurs_lobby - 1
        Else
            Liste_pour_cible_resultats(i) = Liste_pour_cible_resultats(i) - Nombre_joueurs_a_declasser
        End If
    Next i
    
    ' Calcul du score total par catégorie de chaque joueur
    For i = LBound(Liste_reponses) To UBound(Liste_reponses)
        If Theme_actif = "DATES" Then
            Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 0) = Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 0) + Liste_scores(Liste_pour_cible_resultats(i))
        ElseIf Theme_actif = "MONDEVIVANT" Then
            Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 1) = Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 1) + Liste_scores(Liste_pour_cible_resultats(i))
        ElseIf Theme_actif = "ECONOMIE" Then
            Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 2) = Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 2) + Liste_scores(Liste_pour_cible_resultats(i))
        ElseIf Theme_actif = "GEOGRAPHIE" Then
            Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 3) = Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 3) + Liste_scores(Liste_pour_cible_resultats(i))
        ElseIf Theme_actif = "SCIENCES" Then
            Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 4) = Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 4) + Liste_scores(Liste_pour_cible_resultats(i))
        ElseIf Theme_actif = "DIVERTISSEMENT" Then
            Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 5) = Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 5) + Liste_scores(Liste_pour_cible_resultats(i))
        ElseIf Theme_actif = "SONDAGES" Then
            Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 6) = Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 6) + Liste_scores(Liste_pour_cible_resultats(i))
        ElseIf Theme_actif = "IMPROBABLE" Then
            Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 7) = Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 7) + Liste_scores(Liste_pour_cible_resultats(i))
        ElseIf Theme_actif = "RECORDS" Then
            Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 8) = Scores_par_themes((Liste_indices(i) - 1) * Nb_themes + 8) + Liste_scores(Liste_pour_cible_resultats(i))
        End If
    Next
    
    ' Gestion des scores a afficher
    For i = LBound(Liste_reponses) To UBound(Liste_reponses)
    
        ' Affichage du score du joueur sur cette manche
        Me.Controls("label_Score_joueur" & Liste_indices(i)).Visible = True
        Me.Controls("label_Score_joueur" & Liste_indices(i)).Caption = Liste_scores(Liste_pour_cible_resultats(i))
        ' Sur un tout pile, le score est multiplié par 2 et affiché en doré et l'avatar devient content
        If Liste_reponses(i) = 0 Then
            Me.Controls("label_Score_joueur" & Liste_indices(i)).Caption = Liste_scores(Liste_pour_cible_resultats(i)) * 2
            Me.Controls("label_Score_joueur" & Liste_indices(i)).ForeColor = RGB(255, 215, 0)
            Me.Controls("image_Avatar_joueur" & Liste_indices(i)).Picture = LoadPicture(ThisWorkbook.Path & "\Avatars\Avatar" & Liste_avatars(Liste_indices(i)) & "_content.jpg")
        ' Si résultat positif on affiche en vert et l'avatar devient content
        ElseIf CInt(Me.Controls("label_Score_joueur" & Liste_indices(i)).Caption) > 0 Then
            Me.Controls("label_Score_joueur" & Liste_indices(i)).ForeColor = RGB(0, 128, 0)
            Me.Controls("image_Avatar_joueur" & Liste_indices(i)).Picture = LoadPicture(ThisWorkbook.Path & "\Avatars\Avatar" & Liste_avatars(Liste_indices(i)) & "_content.jpg")
        ' Si résultat négatif on affiche en rouge et l'avatar devient decu
        ElseIf CInt(Me.Controls("label_Score_joueur" & Liste_indices(i)).Caption) < 0 Then
            Me.Controls("label_Score_joueur" & Liste_indices(i)).ForeColor = RGB(255, 0, 0)
            Me.Controls("image_Avatar_joueur" & Liste_indices(i)).Picture = LoadPicture(ThisWorkbook.Path & "\Avatars\Avatar" & Liste_avatars(Liste_indices(i)) & "_decu.jpg")
        End If
        
        ' Incrémentation du score total
        Me.Controls("label_Total_joueur" & Liste_indices(i)).Caption = CStr(CInt(Me.Controls("label_Total_joueur" & Liste_indices(i)).Caption) + _
            CInt(Me.Controls("label_Score_joueur" & Liste_indices(i)).Caption))
        
    Next

End Sub





