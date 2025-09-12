Attribute VB_Name = "Routines_utilitaires"
Option Explicit

' ==================================================
'
'      ESPACE DES FONCTIONS COMMUNES AUX IHM
'
' ==================================================


' -----------------------
'
' Fonction appelée dès que l'on souhaite récupérer les informations des joueurs sur la Google Sheet
'
' -----------------------
Function Appel_info_Gsheet() As String

    Dim http As Object, url As String

    ' URL du script Google Apps Script
    url = "https://script.google.com/macros/s/AKfycbyGNDUcwIPHYr6NHMqQ06Af_SCLLhsZjRyZAmnghRnyLXEgC21etonsdcIXKxAydJnq/exec"
    Set http = CreateObject("WinHttp.WinHttpRequest.5.1")
    
    ' Envoi de la requête
    http.Open "GET", url, False
    http.Send
    
    ' Vérification et récupération de la réponse
    If http.Status = 200 Then
        Appel_info_Gsheet = http.responseText
    Else
        MsgBox "Erreur lors de la récupération des données.", vbCritical
        Appel_info_Gsheet = ""
    End If
    
    ' Nettoyage
    Set http = Nothing

End Function


' -----------------------
'
' Fonction appelée dès que l'on affiche une nouvelle IHM pour la centrer
'
' -----------------------
Sub CentreUserForm(frm As Object)

    Dim screenWidth As Integer
    Dim screenHeight As Integer
    Dim formWidth As Integer
    Dim formHeight As Integer
    Dim leftPos As Integer
    Dim topPos As Integer

    ' Obtenir la largeur et la hauteur de l'écran
    screenWidth = Application.UsableWidth
    screenHeight = Application.UsableHeight

    ' Obtenir la largeur et la hauteur du UserForm
    formWidth = frm.Width
    formHeight = frm.Height

    ' Calculer la position Left et Top pour centrer
    leftPos = (screenWidth - formWidth) / 2
    topPos = (screenHeight - formHeight) / 2

    ' Appliquer la position calculée
    frm.Left = leftPos
    frm.Top = topPos
    
End Sub


' -----------------------
'
' Fonction appelée au demarrage et lors du lancement d'une nouvelle partie depuis le "Tableau_des_scores"
'
' -----------------------
Sub Setup_affichage_pour_nouvelle_partie()
    
    ' Calcul du nombre de questions disponibles dans la base de données, et des questions disponibles en sortant celles de l"historique
    Nb_questions_DATES = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "DATES")
    Nb_questions_DATES_disponibles = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "DATES") - Application.WorksheetFunction.CountIf(Sheets("Historique questions").Range("B:B"), "DATES")
    Nb_questions_MONDEVIVANT = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "MONDE VIVANT")
    Nb_questions_MONDEVIVANT_disponibles = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "MONDE VIVANT") - Application.WorksheetFunction.CountIf(Sheets("Historique questions").Range("B:B"), "MONDE VIVANT")
    Nb_questions_ECONOMIE = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "ECONOMIE")
    Nb_questions_ECONOMIE_disponibles = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "ECONOMIE") - Application.WorksheetFunction.CountIf(Sheets("Historique questions").Range("B:B"), "ECONOMIE")
    Nb_questions_GEOGRAPHIE = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "GEOGRAPHIE")
    Nb_questions_GEOGRAPHIE_disponibles = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "GEOGRAPHIE") - Application.WorksheetFunction.CountIf(Sheets("Historique questions").Range("B:B"), "GEOGRAPHIE")
    Nb_questions_SCIENCES = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "SCIENCES")
    Nb_questions_SCIENCES_disponibles = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "SCIENCES") - Application.WorksheetFunction.CountIf(Sheets("Historique questions").Range("B:B"), "SCIENCES")
    Nb_questions_DIVERTISSEMENT = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "DIVERTISSEMENT")
    Nb_questions_DIVERTISSEMENT_disponibles = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "DIVERTISSEMENT") - Application.WorksheetFunction.CountIf(Sheets("Historique questions").Range("B:B"), "DIVERTISSEMENT")
    Nb_questions_SONDAGES = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "SONDAGES")
    Nb_questions_SONDAGES_disponibles = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "SONDAGES") - Application.WorksheetFunction.CountIf(Sheets("Historique questions").Range("B:B"), "SONDAGES")
    Nb_questions_IMPROBABLE = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "IMPROBABLE")
    Nb_questions_IMPROBABLE_disponibles = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "IMPROBABLE") - Application.WorksheetFunction.CountIf(Sheets("Historique questions").Range("B:B"), "IMPROBABLE")
    Nb_questions_RECORDS = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "RECORDS")
    Nb_questions_RECORDS_disponibles = Application.WorksheetFunction.CountIf(Sheets("Base de questions").Range("B:B"), "RECORDS") - Application.WorksheetFunction.CountIf(Sheets("Historique questions").Range("B:B"), "RECORDS")
    
    ' Affichage dans les labels de thèmes des nombre de questions
    frm_Nouvelle_partie.label_Nb_questions_theme1.Caption = Nb_questions_DATES_disponibles & " / " & Nb_questions_DATES & " questions"
    frm_Nouvelle_partie.label_Nb_questions_theme2.Caption = Nb_questions_MONDEVIVANT_disponibles & " / " & Nb_questions_MONDEVIVANT & " questions"
    frm_Nouvelle_partie.label_Nb_questions_theme3.Caption = Nb_questions_ECONOMIE_disponibles & " / " & Nb_questions_ECONOMIE & " questions"
    frm_Nouvelle_partie.label_Nb_questions_theme4.Caption = Nb_questions_GEOGRAPHIE_disponibles & " / " & Nb_questions_GEOGRAPHIE & " questions"
    frm_Nouvelle_partie.label_Nb_questions_theme5.Caption = Nb_questions_SCIENCES_disponibles & " / " & Nb_questions_SCIENCES & " questions"
    frm_Nouvelle_partie.label_Nb_questions_theme6.Caption = Nb_questions_DIVERTISSEMENT_disponibles & " / " & Nb_questions_DIVERTISSEMENT & " questions"
    frm_Nouvelle_partie.label_Nb_questions_theme7.Caption = Nb_questions_SONDAGES_disponibles & " / " & Nb_questions_SONDAGES & " questions"
    frm_Nouvelle_partie.label_Nb_questions_theme8.Caption = Nb_questions_IMPROBABLE_disponibles & " / " & Nb_questions_IMPROBABLE & " questions"
    frm_Nouvelle_partie.label_Nb_questions_theme9.Caption = Nb_questions_RECORDS_disponibles & " / " & Nb_questions_RECORDS & " questions"
    
    ' Affichage du nombre total de questions
    frm_Nouvelle_partie.label_Nb_questions_total.Caption = Nb_questions_DATES_disponibles + Nb_questions_MONDEVIVANT_disponibles + Nb_questions_ECONOMIE_disponibles + _
        Nb_questions_GEOGRAPHIE_disponibles + Nb_questions_SCIENCES_disponibles + Nb_questions_DIVERTISSEMENT_disponibles + Nb_questions_SONDAGES_disponibles + _
        Nb_questions_IMPROBABLE_disponibles + Nb_questions_RECORDS_disponibles & " / " & Nb_questions_DATES + Nb_questions_MONDEVIVANT + Nb_questions_ECONOMIE + _
        Nb_questions_GEOGRAPHIE + Nb_questions_SCIENCES + Nb_questions_DIVERTISSEMENT + Nb_questions_SONDAGES + Nb_questions_IMPROBABLE + Nb_questions_RECORDS & " questions"

    ' Masquage par défaut de la liste des avatars
    frm_Nouvelle_partie.Width = 987
    frm_Nouvelle_partie.button_Acces_avatars.Caption = "Afficher la liste des avatars"

    ' Stockage des images dans la liste des avatars
    Dim i As Integer, Chemin_image_avatar As String
    max_Avatars = 35
    For i = 1 To max_Avatars
        Chemin_image_avatar = ThisWorkbook.Path & "\Avatars\Avatar" & i & "_normal.jpg"
        frm_Nouvelle_partie.Controls("image_Avatar" & i).Picture = LoadPicture(Chemin_image_avatar)
    Next i
    
End Sub


' -----------------------
'
' Fonction appelée après appel à une nouvelle question et initialisation du chronomètre
'
' -----------------------
Sub UpdateChrono()

    If running Then
        ' Calcul du temps restant
        remainingTime = 30 - (Timer - chronoStart)

        If remainingTime <= 0 Then
            ' Arrêt du chronomètre une fois qu'il atteint 0
            remainingTime = 0
            running = False
            ' On reinitialise le label à ""
            frm_Active.label_Chrono.Caption = ""
            ' Affichage des reponses finales des utilisateurs
            Affichage_reponses_joueurs
        Else
            ' Affichage du temps restant sous format "ss" secondes
            frm_Active.label_Chrono.Caption = CStr(Int(remainingTime)) & " s"

            ' Lecture des reponses utilisateurs toutes les 10 secondes pour vérification des formats (blocage au dernier affichage pour chrono sans saut)
            If Int(remainingTime) Mod 10 = 0 And remainingTime <= 5 Then
                ' On passe en visible les images de statut
                Dim i As Integer
                For i = 1 To Nb_joueurs_lobby
                    frm_Active.Controls("image_Statut_joueur" & i).Visible = True
                Next i
                ' Recupération des reponses des joueurs
                Lecture_reponses_utilisateurs
            End If

            ' Planification du prochain appel
            Application.OnTime Now + TimeValue("00:00:01"), "UpdateChrono"
        End If
    End If
End Sub


' -----------------------
'
' Fonction appelée pendant le chronomètre pour récupération des saisies utilisateurs
'
' -----------------------
Sub Lecture_reponses_utilisateurs()

    Dim Info_Gsheet_brut As String
    Dim Info_par_joueurs As Variant
    Dim i As Integer, j As Integer
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
    
    ' Definition du chemin vers les images de statut des réponses
    Dim Chemin_image_faux As String, Chemin_image_vrai As String
    Chemin_image_faux = ThisWorkbook.Path & "\Image_mauvaise_reponse.jpg"
    Chemin_image_vrai = ThisWorkbook.Path & "\Image_bonne_reponse.jpg"
    
    ' Boucle pour saisir les réponses de chaque joueur
    For i = 0 To UBound(Info_par_joueurs)
    
        ' Séparation du nom de la réponse du joueur
        Dim valeurs As Variant
        valeurs = Split(Info_par_joueurs(i), ";")
     
        ' Boucle pour identifier à quel joueur va quelle réponse
        For j = 1 To Nb_joueurs_lobby
            If valeurs(0) = frm_Active.Controls("label_Nom_joueur" & j).Caption Then
                frm_Active.Controls("label_Reponse_joueur" & j).Tag = Replace(valeurs(1), ".", ",")
                frm_Active.Controls("label_Reponse_joueur" & j).Caption = Replace(valeurs(1), ".", ",")
                ' Si la réponse est inconnue, ou pas au bon format, on affiche le statut "FAUX", sinon, le "VRAI"
                If valeurs(1) = "" Or Not IsNumeric(Replace(valeurs(1), ".", ",")) Then
                    frm_Active.Controls("image_Statut_joueur" & j).Picture = LoadPicture(Chemin_image_faux)
                Else
                    frm_Active.Controls("image_Statut_joueur" & j).Picture = LoadPicture(Chemin_image_vrai)
                End If
            End If
        Next j
        
    Next i

End Sub


' -----------------------
'
' Fonction appelée en fin de chronomètre pour afficher les réponses des joueurs et ouvrir le bouton d'affichage des resultats
'
' -----------------------
Sub Affichage_reponses_joueurs()

    ' On rend visible les réponses des utilisateurs, et on recache les images de statut
    Dim i As Integer
    For i = 1 To Nb_joueurs_lobby
        With frm_Active.Controls("label_Reponse_joueur" & i)
            ' Détermination du format de la réponse en fonction du nombre de décimales
            If IsNumeric(.Tag) Then
                Dim formatStr As String
                If CDbl(.Tag) = Int(CDbl(.Tag)) Then
                    formatStr = "#,##0"
                Else
                    formatStr = "#,##0.00"
                End If
                .Caption = Format(.Caption, formatStr)
            End If
            .Visible = True
        End With
        frm_Active.Controls("image_Statut_joueur" & i).Visible = False
    Next i
    frm_Active.button_Resultats.Enabled = True

End Sub


' -----------------------
'
' Fonction appelée lors d'une demande d'affichage ou non de la liste d'avatars (Menu "Creation_partie")
'
' -----------------------
Sub Modifier_taille_nouvelle_partie()

    Dim i As Integer
    Dim stepSize As Integer

    ' Détermination du sens de l'animation
    If Largeur_init < Largeur_fin Then
        stepSize = 5
    Else
        stepSize = -5
    End If

    ' Boucle pour modifier la largeur progressivement
    For i = Largeur_init To Largeur_fin Step stepSize
        frm_Nouvelle_partie.Width = i
        ' Adaptation de la position gauche de l'IHM pour garder le centrage
        frm_Nouvelle_partie.Left = frm_Nouvelle_partie.Left - stepSize / 2
        DoEvents
        Sleep 10
    Next i

End Sub


' -----------------------
'
' Fonction appelée lors d'une demande d'affichage ou non de la liste d'avatars (Menu "Creation_partie")
'
' -----------------------
Sub Modifier_taille_resultats_partie()

    Dim i As Integer
    Dim stepSize As Integer

    ' Détermination du sens de l'animation
    If Largeur_init < Largeur_fin Then
        stepSize = 5
    Else
        stepSize = -5
    End If

    ' Boucle pour modifier la largeur progressivement
    For i = Largeur_init To Largeur_fin Step stepSize
        frm_Tableau_des_scores.Width = i
        ' Adaptation de la position gauche de l'IHM pour garder le centrage
        frm_Tableau_des_scores.Left = frm_Tableau_des_scores.Left - stepSize / 2
        DoEvents
        Sleep 10
    Next i

End Sub


