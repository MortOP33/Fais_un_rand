VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} Tableau_des_scores 
   ClientHeight    =   9465
   ClientLeft      =   120
   ClientTop       =   465
   ClientWidth     =   8955
   OleObjectBlob   =   "Tableau_des_scores.frx":0000
   StartUpPosition =   1  'CenterOwner
End
Attribute VB_Name = "Tableau_des_scores"
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
' Fonction lancée dès l'ouverture de l'IHM
'
' -----------------------
Private Sub UserForm_Activate()
    
    ' Appel à la fonction qui classe les joueurs et les place sur le podium
    Classement_final_joueurs
    
    ' Appel à la fonction pour afficher le tableau des scores dès l'initialisation du UserForm
    AfficherTableauScores
    
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
' Fonction appelée lors de l'ouverture pour calculer placement relatif des joueurs en fin de partie
'
' -----------------------
Sub Classement_final_joueurs()

    Dim i As Integer, j As Integer
    Dim temp_val As Variant
    Dim temp_idx As Integer
    
    ' Initialisation de la liste des indices
    ReDim Classement_final(LBound(Scores_totaux) To UBound(Scores_totaux))
    For i = LBound(Scores_totaux) To UBound(Scores_totaux)
        Classement_final(i) = i + 1
    Next i
    
   ' Tri des valeurs de Scores_totaux et de Liste_indices en vis à vis
    For i = LBound(Scores_totaux) To UBound(Scores_totaux) - 1
        For j = i + 1 To UBound(Scores_totaux)
            If CDbl(Scores_totaux(i)) < CDbl(Scores_totaux(j)) Then
                ' Échanger les valeurs
                temp_val = Scores_totaux(i)
                Scores_totaux(i) = Scores_totaux(j)
                Scores_totaux(j) = temp_val
                ' Échanger les indices correspondants
                temp_idx = Classement_final(i)
                Classement_final(i) = Classement_final(j)
                Classement_final(j) = temp_idx
            End If
        Next j
    Next i
    
    ' Gestion de l'affichage du podium
    For i = LBound(Scores_totaux) To UBound(Scores_totaux)
    
        ' Affichage du nom du joueur au bon emplacement
        Me.Controls("label_Nom_" & i + 1).Visible = True
        Me.Controls("label_Nom_" & i + 1).Caption = Liste_noms(Classement_final(i))
        ' Affichage du rang au delà du podium si suffisament de joueurs
        If i > 2 Then
            Me.Controls("label_" & i + 1).Visible = True
        End If
        ' Gestion de l'avatar
        Me.Controls("Image_avatar_" & i + 1).Visible = True
        ' Si parmis les premiers (selon nombre de joueurs), l'avatar devient content
        If i = 0 Then
            Me.Controls("Image_avatar_" & i + 1).Picture = LoadPicture(ThisWorkbook.Path & "\Avatars\Avatar" & Liste_avatars(Classement_final(i)) & "_content.jpg")
        ' Si parmis les derniers (selon nombre de joueurs), l'avatar devient decu
        ElseIf (i = 1 And Nb_joueurs_lobby = 2) Or (i = 2 And Nb_joueurs_lobby = 3) Or i > 2 Then
            Me.Controls("Image_avatar_" & i + 1).Picture = LoadPicture(ThisWorkbook.Path & "\Avatars\Avatar" & Liste_avatars(Classement_final(i)) & "_decu.jpg")
        ' Sinon, avatar état normal (pied de podium)
        Else
            Me.Controls("Image_avatar_" & i + 1).Picture = LoadPicture(ThisWorkbook.Path & "\Avatars\Avatar" & Liste_avatars(Classement_final(i)) & "_normal.jpg")
        End If
        
    Next

End Sub


' -----------------------
'
' Fonction appelée lors de l'ouverture qui prépare le tableau des scores par catégories et joueurs
'
' -----------------------
Sub AfficherTableauScores()

    Dim i As Integer, j As Integer
    Dim ScoreLabel As Object
    Dim startLeft As Integer
    Dim startTop As Integer
    Dim labelWidth As Integer
    Dim labelHeight As Integer
    Dim labelFontSize As Integer
    
    ' Definition de la position de départ du tableau
    startLeft = 470
    startTop = 10
    ' Definition de la largeur et hauteur des cellules du tableau
    labelWidth = 70
    labelHeight = 18
    ' Definition de la taille de police des cellules du tableau
    labelFontSize = 14
    
    ' Format du tableau :
    
    '                  |  TOTAL  | Theme 1 | Theme 2 | ...
    '   NB QUESTIONS   |   A 1   |   A 2   |   A 3   | ...
    '     Joueur 1     |   B 1   |   B 2   |   B 3   | ...
    '     ........     |   ...   |   ...   |   ...   | ...
    
    ' Affichage de la case "TOTAL" (avec l'offset de l'angle du tableau en haut à gauche)
    Set ScoreLabel = Me.Controls.Add("Forms.Label.1", "Label_total", True)
    ScoreLabel.Caption = "TOTAL"
    ScoreLabel.Left = startLeft + 2 * labelWidth
    ScoreLabel.Top = startTop
    ScoreLabel.Width = labelWidth
    ScoreLabel.Height = labelHeight
    ScoreLabel.FontSize = labelFontSize
    ScoreLabel.TextAlign = fmTextAlignCenter
    ScoreLabel.BorderStyle = fmBorderStyleSingle
    
    ' Affichage de "Theme i" pour chaque thème ayant au moins une question
    Dim Nb_themes_actifs As Integer
    Nb_themes_actifs = 0
    For i = 0 To Nb_themes - 1
        ' Si une question au moins, on incrémente Nb_themes_actifs
        If Nb_questions_posees_valeurs(i) > 0 Then
            Nb_themes_actifs = Nb_themes_actifs + 1
            ' Affichage d'une colonne supplémentaire
            Set ScoreLabel = Me.Controls.Add("Forms.Label.1", "Label_Categorie_" & i + 1, True)
            ' Le nom de la colonne est donné par l'ordre d'origine dans Nb_questions_posees_noms, mais on cherche des valeurs tronquées
            Select Case i
                Case 0: ScoreLabel.Caption = "DATES"
                Case 1: ScoreLabel.Caption = "MONDE V."
                Case 2: ScoreLabel.Caption = "ECONOMIE"
                Case 3: ScoreLabel.Caption = "GEO."
                Case 4: ScoreLabel.Caption = "SCIENCES"
                Case 5: ScoreLabel.Caption = "DIVERT."
                Case 6: ScoreLabel.Caption = "SONDAGES"
                Case 7: ScoreLabel.Caption = "IMPROBA."
                Case 8: ScoreLabel.Caption = "RECORDS"
            End Select
            ScoreLabel.Left = startLeft + (Nb_themes_actifs + 2) * labelWidth
            ScoreLabel.Top = startTop
            ScoreLabel.Width = labelWidth
            ScoreLabel.Height = labelHeight
            ScoreLabel.FontSize = labelFontSize
            ScoreLabel.TextAlign = fmTextAlignCenter
            ScoreLabel.BorderStyle = fmBorderStyleSingle
        End If
    Next i
    
    ' Affichage de la case "NB QUESTIONS"
    Set ScoreLabel = Me.Controls.Add("Forms.Label.1", "Label_nb_questions", True)
    ScoreLabel.Caption = "NB. QUESTIONS"
    ScoreLabel.Left = startLeft
    ScoreLabel.Top = startTop + labelHeight
    ScoreLabel.Width = 2 * labelWidth
    ScoreLabel.Height = labelHeight
    ScoreLabel.FontSize = labelFontSize
    ScoreLabel.TextAlign = fmTextAlignCenter
    ScoreLabel.BorderStyle = fmBorderStyleSingle
    
    ' Affichage de la valeur en "A1"
    Set ScoreLabel = Me.Controls.Add("Forms.Label.1", "Label_nb_questions_total", True)
    ScoreLabel.Caption = Nombre_total_questions_partie
    ScoreLabel.Left = startLeft + 2 * labelWidth
    ScoreLabel.Top = startTop + labelHeight
    ScoreLabel.Width = labelWidth
    ScoreLabel.Height = labelHeight
    ScoreLabel.FontSize = labelFontSize
    ScoreLabel.TextAlign = fmTextAlignCenter
    ScoreLabel.BorderStyle = fmBorderStyleSingle
    
    ' Affichage de "Ai" (i>1) pour chaque thème ayant au moins une question
    Nb_themes_actifs = 0
    For i = 0 To Nb_themes - 1
        ' Si une question au moins, on incrémente Nb_themes_actifs
        If Nb_questions_posees_valeurs(i) > 0 Then
            Nb_themes_actifs = Nb_themes_actifs + 1
            ' Affichage de la case
            Set ScoreLabel = Me.Controls.Add("Forms.Label.1", "Label_Categorie_" & i + 1, True)
            ScoreLabel.Caption = Nb_questions_posees_valeurs(i)
            ScoreLabel.Left = startLeft + (Nb_themes_actifs + 2) * labelWidth
            ScoreLabel.Top = startTop + labelHeight
            ScoreLabel.Width = labelWidth
            ScoreLabel.Height = labelHeight
            ScoreLabel.FontSize = labelFontSize
            ScoreLabel.TextAlign = fmTextAlignCenter
            ScoreLabel.BorderStyle = fmBorderStyleSingle
        End If
    Next i
    
    ' Affichage des cases "B1, B2...Bn, C1, C2...Cn, ..., X1, X2...Xn"
    For i = 1 To Nb_joueurs_lobby
    
        Nb_themes_actifs = 0
        
        ' Affichage du nom de "joueur i"
        Set ScoreLabel = Me.Controls.Add("Forms.Label.1", "Label_nom_joueur_" & i, True)
        ScoreLabel.Caption = Liste_noms(Classement_final(i - 1))
        ScoreLabel.Left = startLeft
        ScoreLabel.Top = startTop + (i + 1) * labelHeight
        ScoreLabel.Width = 2 * labelWidth
        ScoreLabel.Height = labelHeight
        ScoreLabel.FontSize = labelFontSize
        ScoreLabel.TextAlign = fmTextAlignCenter
        ScoreLabel.BorderStyle = fmBorderStyleSingle
        
        ' Affichage du score total de "joueur i" (B1,C1...)
        Set ScoreLabel = Me.Controls.Add("Forms.Label.1", "Label_Score_total_joueur_" & i, True)
        ScoreLabel.Caption = Scores_totaux(i - 1)
        ScoreLabel.Left = startLeft + 2 * labelWidth
        ScoreLabel.Top = startTop + (i + 1) * labelHeight
        ScoreLabel.Width = labelWidth
        ScoreLabel.Height = labelHeight
        ScoreLabel.FontSize = labelFontSize
        ScoreLabel.TextAlign = fmTextAlignCenter
        ScoreLabel.BorderStyle = fmBorderStyleSingle
        
        ' Affichage du reste des cases
        For j = 0 To Nb_themes - 1
            ' Si une question au moins, on incrémente Nb_themes_actifs
            If Nb_questions_posees_valeurs(j) > 0 Then
                Nb_themes_actifs = Nb_themes_actifs + 1
                ' Affichage de la case
                Set ScoreLabel = Me.Controls.Add("Forms.Label.1", "Label_Score_" & i & "_" & j + 1, True)
                ' Le format de la case est le score pour le thème, et la moyenne de point par questions entre parenthèses
                ScoreLabel.Caption = IIf(Nb_questions_posees_valeurs(j) > 0, Scores_par_themes((Classement_final(i - 1) - 1) * Nb_themes + j) & " (" & FormatNumber(Scores_par_themes((Classement_final(i - 1) - 1) * Nb_themes + j) / Nb_questions_posees_valeurs(j), 1) & ")", "N/A")
                ScoreLabel.Left = startLeft + (Nb_themes_actifs + 2) * labelWidth
                ScoreLabel.Top = startTop + (i + 1) * labelHeight
                ScoreLabel.Width = labelWidth
                ScoreLabel.Height = labelHeight
                ScoreLabel.FontSize = labelFontSize
                ScoreLabel.TextAlign = fmTextAlignCenter
                ScoreLabel.BorderStyle = fmBorderStyleSingle
                ' Si le score est positif, affiché en vert
                If CDbl(Scores_par_themes((Classement_final(i - 1) - 1) * Nb_themes + j)) > 0 Then
                    ScoreLabel.ForeColor = RGB(0, 128, 0)
                ' Si le score est négatif, affichage en rouge
                ElseIf CDbl(Scores_par_themes((Classement_final(i - 1) - 1) * Nb_themes + j)) < 0 Then
                    ScoreLabel.ForeColor = RGB(255, 0, 0)
                ' Sinon (0), affichage en noir
                Else
                    ScoreLabel.ForeColor = RGB(0, 0, 0)
                End If
            End If
        Next j
    Next i
    
    ' Appel a la fonction élargi l'affichage des scores en différé
    Largeur_init = 460
    Largeur_fin = 460 + (3 + Nb_themes_actifs) * labelWidth + 40
    Application.OnTime Now + TimeValue("00:00:03"), "Modifier_taille_resultats_partie"
    
End Sub


