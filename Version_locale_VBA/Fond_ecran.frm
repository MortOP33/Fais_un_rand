VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} Fond_ecran 
   ClientHeight    =   3015
   ClientLeft      =   120
   ClientTop       =   465
   ClientWidth     =   4560
   OleObjectBlob   =   "Fond_ecran.frx":0000
   StartUpPosition =   1  'CenterOwner
End
Attribute VB_Name = "Fond_ecran"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit


' -----------------------
'
' Fonction lancée dès l'affichage de la frame
'
' -----------------------
Private Sub UserForm_Initialize()

    ' Taille de l'écran
    Me.Left = 0
    Me.Top = 0
    Me.Width = 1450
    Me.Height = 800

    ' Définir l'image de fond
    Me.Picture = LoadPicture("C:\Users\laure\Documents\Productions\Fais_un_rand\Version_locale_VBA\Fond_ecran.jpg")
    Me.PictureSizeMode = fmPictureSizeModeStretch
    
End Sub
