VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} Invalider_question 
   ClientHeight    =   1125
   ClientLeft      =   120
   ClientTop       =   465
   ClientWidth     =   12765
   OleObjectBlob   =   "Invalider_question.frx":0000
   StartUpPosition =   1  'CenterOwner
End
Attribute VB_Name = "Invalider_question"
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
' Fonction lancée au clic sur le boutton "OUI"
'
' -----------------------
Private Sub Invalider_OUI_Click()

    Dim wsBase As Worksheet
    Set wsBase = ThisWorkbook.Sheets("Base de questions")
    
    ' Repérage de la ligne de la base de données dont l'ID correspond à la question qu'on souhaite supprimer
    Dim Cell As Range
    Set Cell = wsBase.Range("A:A").Find(What:=ID_question_en_cours, LookAt:=xlWhole)

    ' Suppression de la ligne repérée
    If Not Cell Is Nothing Then
        Cell.EntireRow.Delete
    End If

    ' On masque le pop up en fin de traitement
    Me.Hide

End Sub


' -----------------------
'
' Fonction lancée au clic sur le boutton "NON"
'
' -----------------------
Private Sub Invalider_NON_Click()

    ' On masque simplement le pop up
    Me.Hide

End Sub
